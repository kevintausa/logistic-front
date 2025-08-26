import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ReportsSummaryCards = ({
  receptionTotals,
  washingTotals,
  utilityTotals,
  utilityTypeTotals,
  workedHours,
}) => {
  const fmtMoney = (n) =>
    `$${new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0))}`;

  const cardBase =
    'backdrop-blur-md bg-white/70 dark:bg-gray-900/60 shadow-md rounded-2xl border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-5">
      {/* Recepción */}
      <Card className={cardBase}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Recepción (sucio)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">📦 Total kilos procesados</p>
            <p className="text-2xl font-bold">{receptionTotals.kilosProcesados.toFixed(2)} kg</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">🚫 Total rechazo</p>
            <p className="text-lg font-semibold text-rose-600">
              {receptionTotals.kilosRechazo.toFixed(2)}kg ·{" "}
              {(receptionTotals.kilosProcesados
                ? (receptionTotals.kilosRechazo /
                    receptionTotals.kilosProcesados) *
                  100
                : 0
              ).toFixed(2)}%
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">⏳ Pendientes por finalizar</p>
            <p className="text-lg font-semibold">
              {receptionTotals.pendientes} / {receptionTotals.conteo}
            </p>
          </div>

          {/* Desglose */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Desglose rechazo por causa</p>
            <div className="space-y-2 text-sm">
              {[
                { key: 'arrastre', label: 'Arrastre' },
                { key: 'cloro', label: 'Amarilla' },
                { key: 'grasa', label: 'Grasa' },
                { key: 'tintas', label: 'Tintas' },
                { key: 'oxido', label: 'Óxido' },
                { key: 'otro', label: 'Otro' },
              ].map(({ key, label }) => {
                const kilos = Number(receptionTotals?.[key] || 0);
                const pctProc = receptionTotals.kilosProcesados
                  ? (kilos / receptionTotals.kilosProcesados) * 100
                  : 0;
                const pctRech = receptionTotals.kilosRechazo
                  ? (kilos / receptionTotals.kilosRechazo) * 100
                  : 0;

                return (
                  <div
                    key={key}
                    className="flex flex-col rounded-md p-2 bg-gray-50 dark:bg-gray-800/40"
                  >
                    <div className="flex justify-between font-medium text-gray-700 dark:text-gray-200">
                      <span>{label}</span>
                      <span>{kilos.toFixed(2)} kg</span>
                    </div>
                    <div className="mt-1 flex gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        {pctProc.toFixed(1)}% proc.
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                        {pctRech.toFixed(1)}% rech.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ciclos de lavado */}
      <Card className={cardBase}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Ciclos de Lavado (Maquinadas)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">🔁 Ciclos</p>
            <p className="text-2xl font-bold">{washingTotals.ciclos || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">⚙️ Kilos</p>
            <p className="text-2xl font-bold">{(Number(washingTotals.kilosLavados) || 0)} kg</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">📈 Eficiencia</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-emerald-600">
                {(washingTotals.kilosLavados
                  ? (receptionTotals.kilosProcesados / washingTotals.kilosLavados) * 100
                  : 0
                ).toFixed(2)}%
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-lg font-semibold text-rose-600">
                {(washingTotals.kilosLavados
                  ? 100 - (receptionTotals.kilosProcesados / washingTotals.kilosLavados) * 100
                  : 0
                ).toFixed(2)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ciclos abortados</p>
            <p className="text-lg font-semibold text-rose-600">
              {Math.max((Number(washingTotals.ciclos - receptionTotals.conteo) || 0), 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Servicios (Total) */}
      <Card className={cardBase}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Servicios (Total)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">💲 Costo total</p>
            <p className="text-2xl font-bold">{fmtMoney(utilityTotals.costoTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">⚖️ Costo por kilo</p>
            <p className="text-xl font-semibold">
              {fmtMoney((utilityTotals.costoTotal) / (receptionTotals.kilosProcesados || 1))}
            </p>
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">Costo Óptimo</p>
            <p className="text-xs text-gray-500 mb-2">(Capacidad máxima de la lavandería)</p>
            <p className="text-xs text-gray-500">⚖️ Costo por kilo</p>
            <p className="text-xl font-semibold">
              {fmtMoney((utilityTotals.costoTotal) / (washingTotals.kilosLavados || 1))}
            </p>
            <p className="text-xs text-gray-500">💲 Costo total óptimo</p>
            <p className="text-2xl font-semibold">
              {fmtMoney(((utilityTotals.costoTotal) / (washingTotals.kilosLavados || 1)) * receptionTotals.kilosProcesados)}
            </p>
            <p className="text-xs text-gray-500">💸 Dinero desperdiciado</p>
            <p className="text-lg font-semibold text-rose-600">
              {fmtMoney(((utilityTotals.costoTotal) / (washingTotals.kilosLavados || 1)) * receptionTotals.kilosProcesados - utilityTotals.costoTotal)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Servicios por tipo */}
      <Card className={cardBase}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Servicios por tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 divide-y divide-gray-200 dark:divide-gray-700">
          {[
            { key: 'agua', label: '💧 Agua', unit: 'L' },
            { key: 'aguaCaliente', label: '🌋 Agua caliente', unit: 'L' },
            { key: 'gas', label: '🔥 Gas', unit: 'm³' },
            { key: 'Electricidad', label: '⚡ Electricidad', unit: 'kWh' },
          ].map(({ key, label, unit }) => {
            const item = utilityTypeTotals[key] || {};
            return (
              <div key={key} className="pt-2">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{label}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Consumo</span>
                  <span className="font-semibold">{item.consumoLitros?.toFixed(2)} {unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Costo</span>
                  <span className="font-semibold">{fmtMoney(item.costos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Consumo por kilo</span>
                  <span className="font-semibold">
                    {(item.consumoLitros / (receptionTotals.kilosProcesados || 1)).toFixed(2)} {unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Costo por kilo</span>
                  <span className="font-semibold">
                    {fmtMoney((item.costos) / (receptionTotals.kilosProcesados || 1))}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Consumo de Productos */}
      <Card className={cardBase}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Consumo de Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          <p>🧪 Próximamente se integrará el consumo de químicos/insumos por período y por kilo.</p>
        </CardContent>
      </Card>

      {/* Horas trabajadas */}
      <Card className={cardBase}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Horas Trabajadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">🕒 Total horas trabajadas</p>
            <p className="text-2xl font-bold">{Number(workedHours.horasTrabajadas || 0).toFixed(2)} h</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">✅ Total horas autorizadas</p>
            <p className="text-xl font-semibold">{Number(workedHours.horasAutorizadas || 0).toFixed(2)} h</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">⚖️ Kilos por hora (Recepción / Horas autorizadas)</p>
            <p className="text-xl font-semibold">
              {(() => {
                const kg = Number(receptionTotals.kilosProcesados || 0);
                const h = Number(workedHours.horasAutorizadas || 0);
                return (h > 0 ? (kg / h) : 0).toFixed(2);
              })()} kg/h
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSummaryCards;
