import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const DailySeriesCombined = ({
  title = 'Series diarias',
  daysInRange,
  dailySeries,
  dailyReception,
  dailyCycles,
  dailyHoursSeries,
  // Nuevas series por tipo de servicio
  dailyWaterSeries = [],
  dailyGasSeries = [],
  dailyElectricSeries = [],
  // Series de costos por tipo
  dailyWaterCostSeries = [],
  dailyGasCostSeries = [],
  dailyElectricCostSeries = [],
  combinedMax,
}) => {
  // Visibilidad por serie
  const [visible, setVisible] = useState({ rec: true, cyc: true, srv: true, hrs: true, water: true, gas: true, elec: true });
  // Toggle para visualizar costos en lugar de consumo en utilidades por tipo
  const [useCosts, setUseCosts] = useState(false);

  const toggle = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  // Máximo derivado con base en series activas
  const derivedMax = useMemo(() => {
    if (!daysInRange?.length) return 1;
    let maxVal = 0;
    for (let i = 0; i < daysInRange.length; i++) {
      const rec = (dailyReception[i]?.value || 0) * (visible.rec ? 1 : 0);
      const cyc = (dailyCycles[i]?.value || 0) * (visible.cyc ? 1 : 0);
      const srv = (dailySeries[i]?.value || 0) * (visible.srv ? 1 : 0);
      const hrs = (dailyHoursSeries[i]?.value || 0) * (visible.hrs ? 1 : 0);
      const wtr = ((useCosts ? (dailyWaterCostSeries[i]?.value || 0) : (dailyWaterSeries[i]?.value || 0))) * (visible.water ? 1 : 0);
      const gas = ((useCosts ? (dailyGasCostSeries[i]?.value || 0) : (dailyGasSeries[i]?.value || 0))) * (visible.gas ? 1 : 0);
      const ele = ((useCosts ? (dailyElectricCostSeries[i]?.value || 0) : (dailyElectricSeries[i]?.value || 0))) * (visible.elec ? 1 : 0);
      maxVal = Math.max(maxVal, rec, cyc, srv, hrs, wtr, gas, ele);
    }
    return Math.max(1, maxVal);
  }, [daysInRange, dailySeries, dailyReception, dailyCycles, dailyHoursSeries, dailyWaterSeries, dailyGasSeries, dailyElectricSeries, dailyWaterCostSeries, dailyGasCostSeries, dailyElectricCostSeries, visible, useCosts]);
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Controles de visibilidad */}
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <label className={`inline-flex items-center gap-1 ${visible.rec ? '' : 'opacity-60'}`}>
            <input type="checkbox" className="accent-emerald-500" checked={visible.rec} onChange={() => toggle('rec')} />
            <span className="inline-flex items-center"><span className="inline-block w-3 h-3 bg-emerald-500 rounded-sm mr-1" /> Recepción</span>
          </label>
          <label className={`inline-flex items-center gap-1 ${visible.cyc ? '' : 'opacity-60'}`}>
            <input type="checkbox" className="accent-indigo-500" checked={visible.cyc} onChange={() => toggle('cyc')} />
            <span className="inline-flex items-center"><span className="inline-block w-3 h-3 bg-indigo-500 rounded-sm mr-1" /> Ciclos</span>
          </label>
          <label className={`inline-flex items-center gap-1 ${visible.srv ? '' : 'opacity-60'}`}>
            <input type="checkbox" className="accent-sky-500" checked={visible.srv} onChange={() => toggle('srv')} />
            <span className="inline-flex items-center"><span className="inline-block w-3 h-3 bg-sky-500 rounded-sm mr-1" /> Servicios</span>
          </label>
          <label className={`inline-flex items-center gap-1 ${visible.hrs ? '' : 'opacity-60'}`}>
            <input type="checkbox" className="accent-amber-500" checked={visible.hrs} onChange={() => toggle('hrs')} />
            <span className="inline-flex items-center"><span className="inline-block w-3 h-3 bg-amber-500 rounded-sm mr-1" /> Horas</span>
          </label>
          <label className={`inline-flex items-center gap-1 ${visible.water ? '' : 'opacity-60'}`}>
            <input type="checkbox" className="accent-cyan-500" checked={visible.water} onChange={() => toggle('water')} />
            <span className="inline-flex items-center"><span className="inline-block w-3 h-3 bg-cyan-500 rounded-sm mr-1" /> Agua</span>
          </label>
          <label className={`inline-flex items-center gap-1 ${visible.gas ? '' : 'opacity-60'}`}>
            <input type="checkbox" className="accent-orange-500" checked={visible.gas} onChange={() => toggle('gas')} />
            <span className="inline-flex items-center"><span className="inline-block w-3 h-3 bg-orange-500 rounded-sm mr-1" /> Gas</span>
          </label>
          <label className={`inline-flex items-center gap-1 ${visible.elec ? '' : 'opacity-60'}`}>
            <input type="checkbox" className="accent-violet-500" checked={visible.elec} onChange={() => toggle('elec')} />
            <span className="inline-flex items-center"><span className="inline-block w-3 h-3 bg-violet-500 rounded-sm mr-1" /> Electricidad</span>
          </label>
          <span className="ml-auto inline-flex items-center gap-2">
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" className="accent-zinc-600" checked={useCosts} onChange={(e) => setUseCosts(e.target.checked)} />
              Mostrar costos
            </label>
          </span>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="flex items-end gap-3" style={{ minWidth: `${Math.max(700, daysInRange.length * 28)}px` }}>
            {daysInRange.map((date, idx) => {
              const srv = dailySeries[idx]?.value || 0;
              const rec = dailyReception[idx]?.value || 0;
              const cyc = dailyCycles[idx]?.value || 0;
              const hrs = dailyHoursSeries[idx]?.value || 0;
              const wtr = (useCosts ? (dailyWaterCostSeries[idx]?.value || 0) : (dailyWaterSeries[idx]?.value || 0));
              const gas = (useCosts ? (dailyGasCostSeries[idx]?.value || 0) : (dailyGasSeries[idx]?.value || 0));
              const ele = (useCosts ? (dailyElectricCostSeries[idx]?.value || 0) : (dailyElectricSeries[idx]?.value || 0));
              return (
                <div key={date} className="flex flex-col items-center justify-end h-64">
                  <div className="flex items-end gap-1 h-full">
                    {visible.rec && (
                      <div className="w-3 md:w-3.5 bg-emerald-500/80 rounded-t-sm" style={{ height: `${(rec / derivedMax) * 100}%` }} title={`${date}: Recepción ${rec.toFixed(2)} Kg`} />
                    )}
                    {visible.cyc && (
                      <div className="w-3 md:w-3.5 bg-indigo-500/80 rounded-t-sm" style={{ height: `${(cyc / derivedMax) * 100}%` }} title={`${date}: kilos lavados ${cyc.toFixed(2)} Kg , ciclos ${cyc.toFixed(2)}`} />
                    )}
                    {visible.srv && (
                      <div className="w-3 md:w-3.5 bg-sky-500/80 rounded-t-sm" style={{ height: `${(srv / derivedMax) * 100}%` }} title={`${date}: Servicios ${srv.toFixed(2)}`} />
                    )}
                    {visible.hrs && (
                      <div className="w-3 md:w-3.5 bg-amber-500/80 rounded-t-sm" style={{ height: `${(hrs / derivedMax) * 100}%` }} title={`${date}: Horas ${hrs.toFixed(2)} h`} />
                    )}
                    {visible.water && (
                      <div className="w-3 md:w-3.5 bg-cyan-500/80 rounded-t-sm" style={{ height: `${(wtr / derivedMax) * 100}%` }} title={`${date}: Agua ${useCosts ? `$${wtr.toFixed(2)}` : `${wtr.toFixed(2)} L`}`} />
                    )}
                    {visible.gas && (
                      <div className="w-3 md:w-3.5 bg-orange-500/80 rounded-t-sm" style={{ height: `${(gas / derivedMax) * 100}%` }} title={`${date}: Gas ${useCosts ? `$${gas.toFixed(2)}` : `${gas.toFixed(2)} m3`}`} />
                    )}
                    {visible.elec && (
                      <div className="w-3 md:w-3.5 bg-violet-500/80 rounded-t-sm" style={{ height: `${(ele / derivedMax) * 100}%` }} title={`${date}: Electricidad ${useCosts ? `$${ele.toFixed(2)}` : `${ele.toFixed(2)} kWh`}`} />
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{date.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Altura relativa al máximo de las series visibles en el rango</div>
        <div className="mt-2 text-xs">
          <span className={`inline-flex items-center mr-4 ${visible.rec ? '' : 'opacity-50'}`}><span className="inline-block w-3 h-3 bg-emerald-500 rounded-sm mr-1" /> Recepción (Kg)</span>
          <span className={`inline-flex items-center mr-4 ${visible.cyc ? '' : 'opacity-50'}`}><span className="inline-block w-3 h-3 bg-indigo-500 rounded-sm mr-1" /> Ciclos (Kg)</span>
          <span className={`inline-flex items-center mr-4 ${visible.srv ? '' : 'opacity-50'}`}><span className="inline-block w-3 h-3 bg-sky-500 rounded-sm mr-1" /> Servicios (L)</span>
          <span className={`inline-flex items-center mr-4 ${visible.hrs ? '' : 'opacity-50'}`}><span className="inline-block w-3 h-3 bg-amber-500 rounded-sm mr-1" /> Horas (h)</span>
          <span className={`inline-flex items-center mr-4 ${visible.water ? '' : 'opacity-50'}`}><span className="inline-block w-3 h-3 bg-cyan-500 rounded-sm mr-1" /> Agua {useCosts ? '(COP)' : '(L)'}</span>
          <span className={`inline-flex items-center mr-4 ${visible.gas ? '' : 'opacity-50'}`}><span className="inline-block w-3 h-3 bg-orange-500 rounded-sm mr-1" /> Gas {useCosts ? '(COP)' : '(m3)'}</span>
          <span className={`inline-flex items-center ${visible.elec ? '' : 'opacity-50'}`}><span className="inline-block w-3 h-3 bg-violet-500 rounded-sm mr-1" /> Electricidad {useCosts ? '(COP)' : '(kWh)'}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailySeriesCombined;
