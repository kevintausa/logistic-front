import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Generic daily bars chart. Expects series aligned to daysInRange by index.
// Props:
// - title: string
// - daysInRange: string[] (YYYY-MM-DD)
// - series: Array<{ key: string, label: string, color: string, data: Array<{date: string, value: number}>, scale?: number }>
// - scalableKeys?: string[] (keys for which to render a slider)
// - labelSeriesKey?: string (series key to display label values for each day)
// - labelFormatter?: (raw: number) => string
const DailyBars = ({ title = 'Serie diaria', daysInRange = [], series = [], scalableKeys = [], labelSeriesKey, labelFormatter }) => {
  const [visible, setVisible] = useState(() => Object.fromEntries(series.map(s => [s.key, true])));
  const [scales, setScales] = useState(() => Object.fromEntries(series.map(s => [s.key, Number(s.scale || 1)])));
  const [showScales, setShowScales] = useState(false);
  const toggle = (key) => setVisible(v => ({ ...v, [key]: !v[key] }));
  const updateScale = (key, val) => setScales(m => ({ ...m, [key]: val }));

  const derivedMax = useMemo(() => {
    if (!daysInRange?.length) return 1;
    let maxVal = 0;
    for (let i = 0; i < daysInRange.length; i++) {
      for (const s of series) {
        if (!visible[s.key]) continue;
        const scale = Number(scales[s.key] ?? s.scale ?? 1);
        const v = Number(s.data?.[i]?.value || 0) * (isFinite(scale) && scale > 0 ? scale : 1);
        if (v > maxVal) maxVal = v;
      }
    }
    return Math.max(1, maxVal);
  }, [daysInRange, series, visible, scales]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend / Toggles */}
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {series.map(s => (
            <label key={s.key} className={`inline-flex items-center gap-1 ${visible[s.key] ? '' : 'opacity-60'}`}>
              <input type="checkbox" className="accent-zinc-600" checked={!!visible[s.key]} onChange={() => toggle(s.key)} />
              <span className="inline-flex items-center">
                <span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: s.color }} /> {s.label}
                {((scales[s.key] ?? s.scale) && (scales[s.key] ?? s.scale) !== 1) ? (
                  <span className="ml-1 px-1 py-[1px] rounded bg-muted text-muted-foreground">x{(scales[s.key] ?? s.scale)}</span>
                ) : null}
              </span>
            </label>
          ))}
          <button
            type="button"
            className="ml-auto px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setShowScales(v => !v)}
            title={showScales ? 'Ocultar escalas' : 'Mostrar escalas'}
          >
            {showScales ? 'Ocultar escalas' : 'Escalas'}
          </button>
        </div>
        {showScales && scalableKeys?.length ? (
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
            {series.filter(s => scalableKeys.includes(s.key)).map(s => (
              <label key={`scale-${s.key}`} className="inline-flex items-center gap-2">
                <span className="inline-flex items-center"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: s.color }} /> Escala {s.label}</span>
                <input
                  type="range"
                  min={1}
                  max={200}
                  step={0.5}
                  value={Number(scales[s.key] ?? s.scale ?? 1)}
                  onChange={(e) => updateScale(s.key, Number(e.target.value))}
                />
                <span className="w-10 text-right">x{Number(scales[s.key] ?? s.scale ?? 1)}</span>
              </label>
            ))}
          </div>
        ) : null}
        <div className="w-full overflow-x-auto">
          <div className="flex items-end gap-3" style={{ minWidth: `${Math.max(700, daysInRange.length * 28)}px` }}>
            {daysInRange.map((date, idx) => (
              <div key={date} className="flex flex-col items-center justify-end h-64">
                <div className="relative flex items-end gap-1 h-full w-full justify-center">
                  {series.map(s => {
                    const scale = Number(scales[s.key] ?? s.scale ?? 1);
                    const raw = Number(s.data?.[idx]?.value || 0);
                    const val = raw * (isFinite(scale) && scale > 0 ? scale : 1);
                    if (!visible[s.key]) return null;
                    return (
                      <div
                        key={s.key}
                        className="w-3 md:w-3.5 rounded-t-sm"
                        style={{ height: `${(val / derivedMax) * 100}%`, backgroundColor: s.color, opacity: 0.85 }}
                        title={`${date}: ${s.label} ${raw.toFixed(2)}${(scale && scale !== 1) ? ` (x${scale} → ${val.toFixed(2)})` : ''}`}
                      />
                    );
                  })}
                  {labelSeriesKey ? (() => {
                    const s = series.find(ss => ss.key === labelSeriesKey);
                    if (!s || !visible[labelSeriesKey]) return null;
                    const scale = Number(scales[labelSeriesKey] ?? s.scale ?? 1);
                    const raw = Number(s.data?.[idx]?.value || 0);
                    const val = raw * (isFinite(scale) && scale > 0 ? scale : 1);
                    const pct = Number.isFinite(raw) ? raw : 0;
                    const bottomPct = (val / derivedMax) * 100;
                    const text = typeof labelFormatter === 'function' ? labelFormatter(pct) : `${pct.toFixed(1)}`;
                    return (
                      <span
                        className="absolute -translate-x-1/2 translate-y-[-4px] text-[10px] px-1 py-[1px] rounded bg-black/70 text-white"
                        style={{ left: '50%', bottom: `${Math.min(98, Math.max(2, bottomPct))}%` }}
                        title={`Valor original: ${pct.toFixed(2)}`}
                      >
                        {text}
                      </span>
                    );
                  })() : null}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">{date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Altura relativa al máximo de las series visibles</div>
      </CardContent>
    </Card>
  );
};

export default DailyBars;
