import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, RefreshCw } from 'lucide-react';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';

// Utilidades simples para datos falsos
const vias = ['Aérea', 'Marítima', 'Terrestre'];
const tipos = ['Importación', 'Exportación', 'Nacional'];
const clientes = ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Soylent'];
const proveedores = ['DHL', 'Maersk', 'UPS', 'FedEx', 'CMA CGM'];
const incoterms = ['EXW', 'FCA', 'CPT', 'DAP', 'DDP'];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

function generateMockData(seed = Date.now()) {
  // Semilla simple para variar resultados sin dependencias
  const localRand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  const lrand = (min, max) => Math.floor(localRand() * (max - min + 1)) + min;
  const lpick = (arr) => arr[lrand(0, arr.length - 1)];

  const days = 60;
  const today = new Date();
  const byDay = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    byDay.push({
      fecha: d.toISOString().slice(0, 10),
      via: lpick(vias),
      tipo: lpick(tipos),
      cliente: lpick(clientes),
      operaciones: lrand(2, 30),
    });
  }

  const sla = Array.from({ length: 40 }).map((_, idx) => {
    const tat = lrand(12, 120); // horas
    const desvio = lrand(-12, 36); // horas respecto al compromiso
    const onTime = desvio <= 0 ? 1 : localRand() > 0.4 ? 1 : 0; // 60-100% on time
    return {
      id: `SLA-${idx + 1}`,
      operador: lpick(proveedores),
      cliente: lpick(clientes),
      tipo: lpick(tipos),
      tatHoras: tat,
      slaOnTimePct: onTime ? lrand(85, 100) : lrand(50, 84),
    };
  });

  const costos = Array.from({ length: 50 }).map((_, idx) => {
    const costo = lrand(300, 5000) + localRand();
    const ingreso = costo * (1.15 + localRand() * 0.5); // margen 15-65%
    return {
      opId: `OP-${2025}-${String(idx + 1).padStart(4, '0')}`,
      via: lpick(vias),
      proveedor: lpick(proveedores),
      incoterm: lpick(incoterms),
      costo: Number(costo.toFixed(2)),
      ingreso: Number(ingreso.toFixed(2)),
      margen: Number((ingreso - costo).toFixed(2)),
    };
  });

  return { byDay, sla, costos };
}

const KPI = ({ label, value, sub }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </CardContent>
  </Card>
);

const SimpleBar = ({ label, value, max }) => (
  <div className="flex items-center gap-3">
    <div className="w-28 text-xs text-muted-foreground truncate">{label}</div>
    <div className="flex-1 h-3 bg-muted rounded">
      <div className="h-3 bg-primary rounded" style={{ width: `${Math.max(5, Math.round((value / max) * 100))}%` }} />
    </div>
    <div className="w-14 text-right text-xs">{value}</div>
  </div>
);

const ReportsPage = () => {
  const [seed, setSeed] = useState(Date.now());
  const data = useMemo(() => generateMockData(seed), [seed]);

  // Volumen de Operaciones (agregados)
  const totalOps = data.byDay.reduce((acc, r) => acc + r.operaciones, 0);
  const porVia = vias.map(v => ({ via: v, total: data.byDay.filter(r => r.via === v).reduce((a, b) => a + b.operaciones, 0) }));
  const porTipo = tipos.map(t => ({ tipo: t, total: data.byDay.filter(r => r.tipo === t).reduce((a, b) => a + b.operaciones, 0) }));
  const maxVia = Math.max(...porVia.map(x => x.total));
  const maxTipo = Math.max(...porTipo.map(x => x.total));

  // SLA
  const slaAvg = Math.round(data.sla.reduce((a, b) => a + b.slaOnTimePct, 0) / Math.max(1, data.sla.length));
  const tatAvg = Math.round(data.sla.reduce((a, b) => a + b.tatHoras, 0) / Math.max(1, data.sla.length));

  // Costos
  const ingresoTotal = data.costos.reduce((a, b) => a + b.ingreso, 0);
  const costoTotal = data.costos.reduce((a, b) => a + b.costo, 0);
  const margenTotal = ingresoTotal - costoTotal;
  const margenPct = Math.round((margenTotal / Math.max(1, ingresoTotal)) * 100);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Reportes</h1>
        </div>
        <Button variant="outline" onClick={() => setSeed(Date.now())} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Regenerar datos
        </Button>
      </div>

      {/* Volumen de Operaciones */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Volumen de Operaciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Operaciones (60 días)" value={totalOps.toLocaleString()} />
          <KPI label="Promedio diario" value={Math.round(totalOps / 60)} />
          <KPI label="Vía con mayor volumen" value={porVia.sort((a,b)=>b.total-a.total)[0]?.via || '—'} />
          <KPI label="Tipo más frecuente" value={porTipo.sort((a,b)=>b.total-a.total)[0]?.tipo || '—'} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Vía</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {porVia.map((x) => (
              <SimpleBar key={x.via} label={x.via} value={x.total} max={maxVia} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Operación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {porTipo.map((x) => (
              <SimpleBar key={x.tipo} label={x.tipo} value={x.total} max={maxTipo} />
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Cumplimiento de SLA */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cumplimiento de SLA</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPI label="% On Time Promedio" value={`${slaAvg}%`} />
          <KPI label="TAT Promedio (h)" value={tatAvg} />
          <KPI label="Muestras" value={data.sla.length} />
        </div>
        <DataTable
          data={data.sla}
          columns={[
            { id: 'operador', label: 'Operador' },
            { id: 'cliente', label: 'Cliente' },
            { id: 'tipo', label: 'Tipo' },
            { id: 'tatHoras', label: 'TAT (h)', type: 'number' },
            { id: 'slaOnTimePct', label: 'On Time %', type: 'number' },
          ]}
          isLoading={false}
          page={1}
          limit={data.sla.length}
          totalRecords={data.sla.length}
          onPageChange={()=>{}}
          onLimitChange={()=>{}}
        />
      </section>

      {/* Costos por Operación */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Costos por Operación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KPI label="Ingresos" value={`$ ${Math.round(ingresoTotal).toLocaleString()}`} />
          <KPI label="Costos" value={`$ ${Math.round(costoTotal).toLocaleString()}`} />
          <KPI label="Margen" value={`$ ${Math.round(margenTotal).toLocaleString()}`} sub={`(${margenPct}%)`} />
          <KPI label="Operaciones" value={data.costos.length} />
        </div>
        <DataTable
          data={data.costos}
          columns={[
            { id: 'opId', label: 'Operación' },
            { id: 'via', label: 'Vía' },
            { id: 'proveedor', label: 'Proveedor' },
            { id: 'incoterm', label: 'Incoterm' },
            { id: 'costo', label: 'Costo', type: 'number' },
            { id: 'ingreso', label: 'Ingreso', type: 'number' },
            { id: 'margen', label: 'Margen', type: 'number' },
          ]}
          isLoading={false}
          page={1}
          limit={data.costos.length}
          totalRecords={data.costos.length}
          onPageChange={()=>{}}
          onLimitChange={()=>{}}
        />
      </section>
    </div>
  );
};

export default ReportsPage;
