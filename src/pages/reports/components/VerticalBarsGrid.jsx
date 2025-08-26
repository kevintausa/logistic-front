import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const VerticalBarsGrid = ({ title = 'Resumen gráfico', chartData = [], maxChartValue = 1 }) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="grid gap-6 min-w-[700px]" style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0,1fr))` }}>
            {chartData.map((d) => (
              <div key={d.key} className="flex flex-col items-center justify-end h-56">
                <div className="relative w-12 sm:w-14 md:w-16 h-full flex items-end">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{ height: `${(d.value / maxChartValue) * 100}%`, backgroundColor: d.color, opacity: 0.9 }}
                    title={`${d.label}: ${Number(d.value || 0).toFixed(2)}`}
                  />
                </div>
                <div className="mt-2 text-sm font-semibold">{Number(d.value || 0).toFixed(2)}</div>
                <div className="mt-1 text-xs text-center text-muted-foreground px-2">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Escala relativa al mayor valor del rango seleccionado.</div>
      </CardContent>
    </Card>
  );
};

export default VerticalBarsGrid;
