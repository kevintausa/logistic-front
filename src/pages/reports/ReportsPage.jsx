import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReportsFilters from '@/pages/reports/components/ReportsFilters';
import ReportsSummaryCards from '@/pages/reports/components/ReportsSummaryCards';
import VerticalBarsGrid from '@/pages/reports/components/VerticalBarsGrid';
import DailySeriesCombined from '@/pages/reports/components/DailySeriesCombined';
import DailyBars from '@/pages/reports/components/DailyBars';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getReceptionReportTotals, getReceptionDaily } from '@/pages/reception/services/reception.services';
import { getWashingCycleReportTotals, getWashingCycleDaily } from '@/pages/washingCycles/services/washingCycles.services';
import { getUtilityReportTotals, getUtilityDaily } from '@/pages/reports/services/utilities.reports.services';
import { fetchLaundries } from '@/pages/parametrizacion/laundries/Services/laundries.services';
import { getWorkedHoursDailyReport, getWorkedHoursSummary } from '@/pages/workedHours/services/workedHours.services';

const toISODate = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();

const ReportsPage = () => {
  const { toast } = useToast();
  const { user, ROLES: R } = useAuth();

  // Filtros
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(toISODate(firstDayOfMonth));
  const [endDate, setEndDate] = useState(toISODate(today));
  const [laundries, setLaundries] = useState([]);
  const [idLavanderia, setIdLavanderia] = useState(() => user?.lavanderia?._id || user?.lavanderia?.id || '');

  // Resultados
  const [loading, setLoading] = useState(false);
  const [receptionTotals, setReceptionTotals] = useState({ kilosProcesados: 0, kilosRechazo: 0, pendientes: 0, conteo: 0 });
  const [washingTotals, setWashingTotals] = useState({ kilosLavados: 0, ciclos: 0 });
  const [utilityTotals, setUtilityTotals] = useState({ consumoLitros: 0, costoTotal: 0 });
  const [utilityTypeTotals, setUtilityTypeTotals] = useState({
    agua: { consumoLitros: 0, costos: 0 },
    gas: { consumoLitros: 0, costos: 0 },
    Electricidad: { consumoLitros: 0, costos: 0 },
    aguaCaliente: { consumoLitros: 0, costos: 0 },
  });
  const [utilityDailyFromApi, setUtilityDailyFromApi] = useState([]);
  const [utilityDailyTypesFromApi, setUtilityDailyTypesFromApi] = useState([]);
  const [receptionDailyFromApi, setReceptionDailyFromApi] = useState([]);
  const [washingDailyFromApi, setWashingDailyFromApi] = useState([]);
  const [receptionRejectionDailyFromApi, setReceptionRejectionDailyFromApi] = useState([]);
  const [workedHours, setWorkedHours] = useState({ horasTrabajadas: 0, horasAutorizadas: 0 });
  const [workedHoursDailyFromApi, setWorkedHoursDailyFromApi] = useState([]);
  const [workedHoursAuthorizedDailyFromApi, setWorkedHoursAuthorizedDailyFromApi] = useState([]);

  const isCentroLavado = user?.role === R.CENTRO_LAVADO;

  // Refs eliminados: ahora están dentro de ReportsFilters

  // Cargar lavanderías si es admin u otros roles con acceso múltiple
  useEffect(() => {
    const load = async () => {
      try {
        if (isCentroLavado) return; // no necesita catálogo, queda fija
        const resp = await fetchLaundries({ query: { estado: 'Activo' }, limit: 1000 });
        setLaundries(resp?.data || []);
      } catch (e) {
        // silencioso
      }
    };
    load();
  }, [isCentroLavado]);

  // Normalizar rango de fechas
  const dateRange = useMemo(() => ({
    $gte: startDate,
    $lte: new Date(new Date(endDate).setHours(23,59,59,999)).toISOString(),
  }), [startDate, endDate]);

  const canQuery = useMemo(() => !!(idLavanderia), [idLavanderia]);

  const loadData = useCallback(async () => {
    if (!canQuery) return;
    setLoading(true);
    try {
      const commonQuery = { 'lavanderia.id': idLavanderia, createdAt: dateRange };

      // 1) Recepciones (endpoints de reportes)
      try {
        const totalsResp = await getReceptionReportTotals({ query: commonQuery });
        const t = totalsResp?.data || {};
        setReceptionTotals({
          kilosProcesados: Number(t.kilosProcesados || 0),
          kilosRechazo: Number(t.kilosRechazo || 0),
          pendientes: Number(t.pendientes || 0),
          conteo: Number(t.conteo || 0),
          // incluir desglose de rechazo
          arrastre: Number(t.arrastre || 0),
          cloro: Number(t.cloro || 0),
          grasa: Number(t.grasa || 0),
          tintas: Number(t.tintas || 0),
          oxido: Number(t.oxido || 0),
          otro: Number(t.otro || 0),
          // opcional: kilosLimpios si se usa en otros lugares
          kilosLimpios: Number(t.kilosLimpios || 0),
        });
      } catch (e) {
        setReceptionTotals({ kilosProcesados: 0, kilosRechazo: 0, pendientes: 0, conteo: 0, arrastre: 0, cloro: 0, grasa: 0, tintas: 0, oxido: 0, otro: 0, kilosLimpios: 0 });
      }

      try {
        const dailyResp = await getReceptionDaily({ query: commonQuery, groupBy: 'day' });
        const items = Array.isArray(dailyResp?.data) ? dailyResp.data : [];
        // Series separadas: procesados (pesoKg) y rechazo (rechazoKg)
        const processed = items.map(it => ({
          date: String(it.date || '').slice(0, 10),
          value: Number(it.pesoKg ?? 0),
        }));
        const rejected = items.map(it => ({
          date: String(it.date || '').slice(0, 10),
          value: Number(it.rechazoKg ?? 0),
        }));
        setReceptionDailyFromApi(processed);
        setReceptionRejectionDailyFromApi(rejected);
      } catch (e) {
        setReceptionDailyFromApi([]); // se usará fallback local
        setReceptionRejectionDailyFromApi([]);
      }

      // 2) Ciclos de lavado (endpoints de reportes)
      try {
        const wTotalsResp = await getWashingCycleReportTotals({ query: commonQuery });
        const wt = wTotalsResp?.data || {};
        setWashingTotals({
          kilosLavados: Number(wt.kilosLavados || wt.kilos || 0),
          ciclos: Number(wt.ciclos || 0),
        });
      } catch (e) {
        setWashingTotals({ kilosLavados: 0, ciclos: 0 });
      }

      // Serie diaria de ciclos desde backend (kg lavados por día)
      try {
        const wDailyResp = await getWashingCycleDaily({ query: commonQuery, groupBy: 'day' });
        const items = Array.isArray(wDailyResp?.data) ? wDailyResp.data : [];
        const normalized = items.map(it => ({
          date: String(it.date || '').slice(0, 10),
          value: Number(it.kilosLavados ?? it.kilos ?? 0),
        }));
        setWashingDailyFromApi(normalized);
      } catch (e) {
        setWashingDailyFromApi([]);
      }

      // 3) Servicios (agua/energía/gas): totales y serie diaria
      try {
        const uTotalsResp = await getUtilityReportTotals({ query: commonQuery });
        const data = uTotalsResp?.data || {};
        const tot = data?.totales || {};
        const porTipo = Array.isArray(data?.porTipo) ? data.porTipo : [];
        setUtilityTotals({
          consumoLitros: Number(tot.consumoLitros || 0),
          costoTotal: Number(tot.costos || tot.costoTotal || 0),
        });
        const byType = { agua: { consumoLitros: 0, costos: 0 }, gas: { consumoLitros: 0, costos: 0 }, Electricidad: { consumoLitros: 0, costos: 0 }, aguaCaliente: { consumoLitros: 0, costos: 0 } };
        for (const item of porTipo) {
          const raw = String(item?.tipo || '').trim();
          const low = raw.toLowerCase();
          let k = '';
          if (low === 'agua') k = 'agua';
          else if (low === 'gas') k = 'gas';
          else if (low === 'electricidad') k = 'Electricidad';
          else if (low === 'agua caliente') k = 'aguaCaliente';
          // fallback por si llegan variantes inesperadas
          else if (/agua/i.test(raw)) k = 'agua';
          else if (/gas/i.test(raw)) k = 'gas';
          else if (/elec/i.test(raw)) k = 'Electricidad';
          else if (/agua caliente/i.test(raw)) k = 'aguaCaliente';
          if (k && Object.prototype.hasOwnProperty.call(byType, k)) {
            byType[k] = {
              consumoLitros: Number(item.consumoLitros || 0),
              costos: Number(item.costos || 0),
            };
          }
        }
        setUtilityTypeTotals(byType);
      } catch (e) {
        setUtilityTotals({ consumoLitros: 0, costoTotal: 0 });
        setUtilityTypeTotals({ agua: { consumoLitros: 0, costos: 0 }, gas: { consumoLitros: 0, costos: 0 }, Electricidad: { consumoLitros: 0, costos: 0 }, aguaCaliente: { consumoLitros: 0, costos: 0 } });
      }

      try {
        const uDailyResp = await getUtilityDaily({ query: commonQuery, groupBy: 'day' });
        const items = Array.isArray(uDailyResp?.data) ? uDailyResp.data : [];
        // normalizar a formato {date, value} usando total.consumoLitros
        const normalized = items.map(it => ({
          date: String(it.date || '').slice(0, 10),
          value: Number(it?.total?.consumoLitros || 0),
        }));
        setUtilityDailyFromApi(normalized);
        // guardar por tipo para futuras gráficas
        const byTypeSeries = items.map(it => ({
          date: String(it.date || '').slice(0, 10),
          agua: {
            consumoLitros: Number(it?.agua?.consumoLitros || 0),
            costos: Number(it?.agua?.costos || 0),
          },
          gas: {
            consumoLitros: Number(it?.gas?.consumoLitros || 0),
            costos: Number(it?.gas?.costos || 0),
          },
          Electricidad: {
            consumoLitros: Number(it?.Electricidad?.consumoLitros || 0),
            costos: Number(it?.Electricidad?.costos || 0),
          },
          total: {
            consumoLitros: Number(it?.total?.consumoLitros || 0),
            costos: Number(it?.total?.costos || 0),
          },
        }));
        setUtilityDailyTypesFromApi(byTypeSeries);
      } catch (e) {
        setUtilityDailyFromApi([]);
        setUtilityDailyTypesFromApi([]);
      }

      // 4) Horas trabajadas: totales y serie diaria desde backend (usar campo fecha)
      try {
        const whQuery = { 'lavanderia.id': idLavanderia, fecha: dateRange };
        // Totales
        const whTotalsResp = await getWorkedHoursSummary(whQuery);
        const wht = whTotalsResp?.data || {};
        setWorkedHours({
          horasTrabajadas: Number(wht.totalHorasTrabajadas || 0),
          horasAutorizadas: Number(wht.totalHorasAutorizadas || 0),
        });
        // Serie diaria
        const whDailyResp = await getWorkedHoursDailyReport({ query: whQuery, groupBy: 'day' });
        const items = Array.isArray(whDailyResp?.data) ? whDailyResp.data : [];
        const normalized = items.map(it => ({
          date: String(it.date || '').slice(0, 10),
          value: Number(it.totalHorasTrabajadas || 0),
        }));
        setWorkedHoursDailyFromApi(normalized);
        const normalizedAuth = items.map(it => ({
          date: String(it.date || '').slice(0, 10),
          value: Number(it.totalHorasAutorizadas || 0),
        }));
        setWorkedHoursAuthorizedDailyFromApi(normalizedAuth);
      } catch (e) {
        setWorkedHours({ horasTrabajadas: 0, horasAutorizadas: 0 });
        setWorkedHoursDailyFromApi([]);
        setWorkedHoursAuthorizedDailyFromApi([]);
      }
    } catch (e) {
      toast({ title: 'Reportes', description: e.message || 'Error al cargar reportes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [canQuery, idLavanderia, dateRange, toast]);

  useEffect(() => {
    // fijar lavandería si rol centro_lavado
    if (isCentroLavado) {
      const myId = user?.lavanderia?._id || user?.lavanderia?.id;
      if (myId) setIdLavanderia(String(myId));
    }
  }, [isCentroLavado, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Datos para gráfica de barras simple (sin dependencias externas)
  const chartData = useMemo(() => ([
    { key: 'recepcion', label: 'Recepción (Kg)', value: Number(receptionTotals.kilosProcesados || 0), color: '#10b981' },
    { key: 'ciclos', label: 'Ciclos (Kg lavados)', value: Number(washingTotals.kilosLavados || 0), color: '#6366f1' },
    { key: 'agua', label: 'Agua (L)', value: Number(utilityTypeTotals.agua.consumoLitros || 0), color: '#0ea5e9' },
    { key: 'aguaCaliente', label: 'Agua caliente (L)', value: Number(utilityTypeTotals.aguaCaliente?.consumoLitros || 0), color: '#0ea5e9' },
    { key: 'gas', label: 'Gas (L)', value: Number(utilityTypeTotals.gas.consumoLitros || 0), color: '#f59e0b' },
    { key: 'electricidad', label: 'Electricidad (L)', value: Number(utilityTypeTotals.Electricidad.consumoLitros || 0), color: '#a21caf' },
    { key: 'horas', label: 'Horas trabajadas', value: Number(workedHours.horasTrabajadas || 0), color: '#6b7280' },
  ]), [utilityTypeTotals, receptionTotals.kilosProcesados, washingTotals.kilosLavados, workedHours.horasTrabajadas]);

  // Máximo combinado para escalar barras comparables
  const maxChartValue = useMemo(() => {
    const m = Math.max(...chartData.map(d => d.value));
    return m > 0 ? m : 1; // evitar división por 0
  }, [chartData]);

  // Utilidad: consumo por día
  const toYMD = (d) => {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const daysInRange = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // normalizar a medianoche
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const days = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(toYMD(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  const dailyConsumption = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    if (utilityDailyFromApi?.length) {
      for (const it of utilityDailyFromApi) {
        const key = typeof it.date === 'string' ? String(it.date).slice(0, 10) : toYMD(it.date || new Date());
        const val = Number(it.value || 0);
        if (map.has(key)) map.set(key, map.get(key) + val);
      }
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [utilityDailyFromApi, daysInRange]);

  // Serie diaria por tipo (para futuras gráficas), con fallback a lista cuando no hay API
  const dailyUtilitiesByType = useMemo(() => {
    const map = new Map(daysInRange.map(d => [d, { agua: 0, gas: 0, Electricidad: 0 }]));
    if (utilityDailyTypesFromApi?.length) {
      for (const it of utilityDailyTypesFromApi) {
        const key = toYMD(it.date || new Date());
        if (map.has(key)) {
          const cur = map.get(key);
          cur.agua += Number(it.agua || 0);
          cur.gas += Number(it.gas || 0);
          cur.Electricidad += Number(it.Electricidad || 0);
          map.set(key, cur);
        }
      }
    }
    return daysInRange.map(d => ({ date: d, ...map.get(d) }));
  }, [utilityDailyTypesFromApi, daysInRange]);

  const maxDaily = useMemo(() => {
    const m = Math.max(...dailyConsumption.map(d => d.value));
    return m > 0 ? m : 1;
  }, [dailyConsumption]);

  // Fallback: datos de ejemplo si no hay consumo real (todos 0)
  const isDailyEmpty = useMemo(() => dailyConsumption.every(d => d.value === 0), [dailyConsumption]);
  const mockDaily = useMemo(() => {
    if (!isDailyEmpty) return [];
    return daysInRange.map((d, i) => ({
      date: d,
      value: Math.max(0, Math.round(80 + 60 * Math.sin(i / 2) + Math.random() * 40)),
    }));
  }, [isDailyEmpty, daysInRange]);
  const dailySeries = isDailyEmpty ? mockDaily : dailyConsumption;
  const maxDailySeries = useMemo(() => {
    const m = Math.max(...dailySeries.map(d => d.value));
    return m > 0 ? m : 1;
  }, [dailySeries]);

  // Recepción (kg) por día usando backend si está disponible; fallback a cálculo local
  const dailyReception = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of receptionDailyFromApi) {
      const key = typeof it.date === 'string' ? String(it.date).slice(0, 10) : toYMD(it.date || new Date());
      const val = Number(it.value || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [receptionDailyFromApi, daysInRange]);

  // Ciclos (kg lavados) por día — usar backend si está disponible; fallback a lista local
  const dailyCycles = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of washingDailyFromApi) {
      const key = typeof it.date === 'string' ? String(it.date).slice(0, 10) : toYMD(it.date || new Date());
      const val = Number(it.value || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [washingDailyFromApi, daysInRange]);

  // Rechazo (kg) por día desde recepciones
  const dailyRejection = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of receptionRejectionDailyFromApi) {
      const key = typeof it.date === 'string' ? String(it.date).slice(0, 10) : toYMD(it.date || new Date());
      const val = Number(it.value || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [receptionRejectionDailyFromApi, daysInRange]);

  // Horas trabajadas por día desde backend; si todo 0, usar ejemplo para visual
  const dailyHours = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of workedHoursDailyFromApi) {
      const key = typeof it.date === 'string' ? String(it.date).slice(0, 10) : toYMD(it.date || new Date());
      const val = Number(it.value || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [workedHoursDailyFromApi, daysInRange]);
  const isHoursEmpty = useMemo(() => dailyHours.every(d => d.value === 0), [dailyHours]);
  const mockHours = useMemo(() => {
    if (!isHoursEmpty) return [];
    return daysInRange.map((d, i) => ({ date: d, value: Math.max(0, Math.round(4 + 3 * Math.sin(i / 3) + Math.random() * 2)) }));
  }, [isHoursEmpty, daysInRange]);
  const dailyHoursSeries = isHoursEmpty ? mockHours : dailyHours;

  // Horas autorizadas por día (serie adicional)
  const dailyHoursAuthorized = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of workedHoursAuthorizedDailyFromApi) {
      const key = typeof it.date === 'string' ? String(it.date).slice(0, 10) : toYMD(it.date || new Date());
      const val = Number(it.value || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [workedHoursAuthorizedDailyFromApi, daysInRange]);

  // Servicios ya calculado: dailySeries

  // Series diarias por tipo de servicio (agua, gas, electricidad)
  const dailyWaterSeries = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of utilityDailyTypesFromApi) {
      const key = String(it.date || '').slice(0, 10);
      const val = Number(it?.agua?.consumoLitros || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [utilityDailyTypesFromApi, daysInRange]);

  const dailyGasSeries = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of utilityDailyTypesFromApi) {
      const key = String(it.date || '').slice(0, 10);
      const val = Number(it?.gas?.consumoLitros || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [utilityDailyTypesFromApi, daysInRange]);

  const dailyElectricSeries = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of utilityDailyTypesFromApi) {
      const key = String(it.date || '').slice(0, 10);
      const val = Number(it?.Electricidad?.consumoLitros || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [utilityDailyTypesFromApi, daysInRange]);

  // Series de costos por tipo (agua, gas, electricidad)
  const dailyWaterCostSeries = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of utilityDailyTypesFromApi) {
      const key = String(it.date || '').slice(0, 10);
      const val = Number(it?.agua?.costos || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [utilityDailyTypesFromApi, daysInRange]);

  const dailyGasCostSeries = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of utilityDailyTypesFromApi) {
      const key = String(it.date || '').slice(0, 10);
      const val = Number(it?.gas?.costos || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [utilityDailyTypesFromApi, daysInRange]);

  const dailyElectricCostSeries = useMemo(() => {
    const map = new Map();
    for (const d of daysInRange) map.set(d, 0);
    for (const it of utilityDailyTypesFromApi) {
      const key = String(it.date || '').slice(0, 10);
      const val = Number(it?.Electricidad?.costos || 0);
      if (map.has(key)) map.set(key, map.get(key) + val);
    }
    return daysInRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
  }, [utilityDailyTypesFromApi, daysInRange]);

  // Máximo combinado para escalar barras comparables
  const combinedMax = useMemo(() => {
    const all = [
      ...dailySeries.map(d => d.value),
      ...dailyReception.map(d => d.value),
      ...dailyCycles.map(d => d.value),
      ...dailyHoursSeries.map(d => d.value),
    ];
    const m = Math.max(...all);
    return m > 0 ? m : 1;
  }, [dailySeries, dailyReception, dailyCycles, dailyHoursSeries]);

  // Porcentaje de rechazo vs recepción por día
  const dailyRejectionPct = useMemo(() => {
    if (!daysInRange?.length) return [];
    // Aseguramos alineación por índice con daysInRange
    return daysInRange.map((d, idx) => {
      const rec = Number(dailyReception[idx]?.value || 0);
      const rej = Number(dailyRejection[idx]?.value || 0);
      const pct = rec > 0 ? (rej / rec) * 100 : 0;
      return { date: d, value: Number.isFinite(pct) ? pct : 0 };
    });
  }, [daysInRange, dailyReception, dailyRejection]);

  // (Opcional) Máximo por tipo de servicios - no usado actualmente

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 lg:p-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Reporte General Pro-360</h1>
        <ReportsFilters
          isCentroLavado={isCentroLavado}
          laundries={laundries}
          idLavanderia={idLavanderia}
          setIdLavanderia={setIdLavanderia}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          loading={loading}
          canQuery={canQuery}
          onApply={loadData}
        />
      </div>

      <ReportsSummaryCards
        receptionTotals={receptionTotals}
        washingTotals={washingTotals}
        utilityTotals={utilityTotals}
        utilityTypeTotals={utilityTypeTotals}
        workedHours={workedHours}
      />

      <VerticalBarsGrid title="Resumen gráfico" chartData={chartData} maxChartValue={maxChartValue} />

      {/* 1) Recepción, Ciclos y Rechazo */}
      <DailyBars
        title="Serie diaria: Recepción, Ciclos y Rechazo"
        daysInRange={daysInRange}
        series={[
          { key: 'rec', label: 'Recepción (Kg)', color: '#10b981', data: dailyReception },
          { key: 'cyc', label: 'Ciclos (Kg lavados)', color: '#6366f1', data: dailyCycles },
          { key: 'rej', label: 'Rechazo (Kg)', color: '#ef4444', data: dailyRejection, scale: 5 },
          { key: 'rejPct', label: 'Rechazo (%)', color: '#f97316', data: dailyRejectionPct },
        ]}
        scalableKeys={['rec', 'cyc', 'rej', 'rejPct']}
        labelSeriesKey="rejPct"
        labelFormatter={(v) => `${Number(v).toFixed(1)}%`}
      />

      {/* 2) Recepción y Servicios (discriminado por tipo) */}
      <DailyBars
        title="Serie diaria: Recepción y Servicios"
        daysInRange={daysInRange}
        series={[
          { key: 'rec', label: 'Recepción (Kg)', color: '#10b981', data: dailyReception },
          { key: 'agua', label: 'Agua (L)', color: '#0ea5e9', data: dailyWaterSeries, scale: 1 },
          { key: 'gas', label: 'Gas (L)', color: '#f59e0b', data: dailyGasSeries, scale: 1 },
          { key: 'elec', label: 'Electricidad (kWh)', color: '#a21caf', data: dailyElectricSeries, scale: 1 },
        ]}
        scalableKeys={['rec', 'agua', 'gas', 'elec']}
      />

      {/* 3) Recepción y Horas */}
      <DailyBars
        title="Serie diaria: Recepción y Horas"
        daysInRange={daysInRange}
        series={[
          { key: 'rec', label: 'Recepción (Kg)', color: '#10b981', data: dailyReception },
          { key: 'hrs', label: 'Horas (h)', color: '#6b7280', data: dailyHoursSeries },
          { key: 'hrsAuth', label: 'Horas autorizadas (h)', color: '#0ea5e9', data: dailyHoursAuthorized, scale: 1 },
        ]}
        scalableKeys={['rec', 'hrs', 'hrsAuth']}
      />
    </motion.div>
  );
};

export default ReportsPage;
