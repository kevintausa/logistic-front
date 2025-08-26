// Utilities to compute worked hour metrics with planning and nocturnal rules
// Inputs expect ISO date in record.fecha and HH:mm strings for times.

function parseTimeOnDate(dateStr, hhmm) {
  if (!dateStr || !hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m || 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function minutesBetween(a, b) {
  return (b - a) / 60000; // minutes
}

function clampStartForAttendance(realIn, plannedStart) {
  // Attendance allowed up to 20 min before, but NOT counted as worked normal time.
  // We return the same realIn; counting logic will decide. This function is a placeholder
  // in case we later want to block check-ins earlier than plannedStart - 20 min.
  if (!realIn || !plannedStart) return realIn;
  const allowedEarly = new Date(plannedStart.getTime() - 20 * 60000);
  if (realIn < allowedEarly) return allowedEarly; // clamp to earliest allowed mark
  return realIn;
}

function overlapMinutes(rangeA, rangeB) {
  const start = new Date(Math.max(rangeA.start.getTime(), rangeB.start.getTime()));
  const end = new Date(Math.min(rangeA.end.getTime(), rangeB.end.getTime()));
  return Math.max(0, minutesBetween(start, end));
}

export function computeWorkedMetrics(record, rateConfig = {}) {
  // Extract times
  const fecha = record.fecha || record.date || record.dia;
  const horaIngreso = record.horaIngreso || record.clockIn;
  const horaSalida = record.horaSalida || record.clockOut;

  if (!fecha || !horaIngreso || !horaSalida) {
    return {
      horasTrabajadas: 0,
      horasExtras: 0,
      llegadaTarde: 0,
      horasNocturnas: 0,
      totalHoras: 0,
      costoTotal: 0,
    };
  }

  let inDt = parseTimeOnDate(fecha, horaIngreso);
  let outDt = parseTimeOnDate(fecha, horaSalida);
  if (outDt && inDt && outDt <= inDt) {
    // Cross midnight
    outDt = addDays(outDt, 1);
  }

  // Planned times: try several field names
  const planStartStr = record.planInicio || record.plannedStart || record.horaInicioPlanificada || record.planHoraInicio || record.plan_start;
  const planEndStr = record.planFin || record.plannedEnd || record.horaFinPlanificada || record.planHoraFin || record.plan_end;
  const planStart = planStartStr ? parseTimeOnDate(fecha, planStartStr) : null;
  let planEnd = planEndStr ? parseTimeOnDate(fecha, planEndStr) : null;
  if (planEnd && planStart && planEnd <= planStart) {
    planEnd = addDays(planEnd, 1);
  }

  // Apply early marking clamp (attendance allowed up to 20 min before planned, but not paid extra)
  inDt = clampStartForAttendance(inDt, planStart);

  // Total worked minutes (raw)
  const workedMin = Math.max(0, minutesBetween(inDt, outDt));

  // Nocturnal window [19:00, 06:00 next day]
  const noctStart = parseTimeOnDate(fecha, '19:00');
  let noctEnd = parseTimeOnDate(fecha, '06:00');
  // noctEnd is next day 06:00
  noctEnd = addDays(noctEnd, 1);

  const workRange = { start: inDt, end: outDt };
  const noctRange = { start: noctStart, end: noctEnd };
  const noctMin = overlapMinutes(workRange, noctRange);

  // Late arrival minutes (only if plannedStart exists and realIn > plannedStart)
  let llegadaTarde = 0;
  if (planStart) {
    const effectiveStartForLate = new Date(planStart); // planned start is baseline
    if (inDt > effectiveStartForLate) {
      llegadaTarde = Math.round(minutesBetween(effectiveStartForLate, inDt));
    }
  }

  // Split remaining non-nocturnal minutes into normal vs extra with planning rules
  // Start with all diurnal minutes worked
  let diurnalMin = Math.max(0, workedMin - noctMin);

  // Remove diurnal minutes before planStart (not paid, even if marked early). Nocturnas before plan sí cuentan.
  if (planStart) {
    const prePlanRange = { start: inDt, end: planStart < outDt ? planStart : outDt };
    const prePlanTotal = Math.max(0, minutesBetween(prePlanRange.start, prePlanRange.end));
    const prePlanNoct = overlapMinutes(prePlanRange, noctRange);
    const prePlanDiurnal = Math.max(0, prePlanTotal - prePlanNoct);
    diurnalMin = Math.max(0, diurnalMin - prePlanDiurnal);
  }

  // From remaining diurnal, extras are minutes after planEnd; nocturnas after plan are NOT extras (se cuentan en nocturnas)
  let extraMin = 0;
  if (planEnd) {
    const postPlanStart = planEnd > inDt ? planEnd : inDt;
    const postPlanRange = { start: postPlanStart, end: outDt };
    const postPlanTotal = Math.max(0, minutesBetween(postPlanRange.start, postPlanRange.end));
    const postPlanNoct = overlapMinutes(postPlanRange, noctRange);
    const postPlanDiurnal = Math.max(0, postPlanTotal - postPlanNoct);
    extraMin = Math.min(diurnalMin, postPlanDiurnal);
  }

  const normalMin = Math.max(0, diurnalMin - extraMin);

  const horasTrabajadas = +(normalMin / 60).toFixed(2);
  const horasExtras = +(extraMin / 60).toFixed(2);
  const horasNocturnas = +(noctMin / 60).toFixed(2);
  const totalHoras = +( (normalMin + extraMin + noctMin) / 60 ).toFixed(2);

  // Cost calculation
  const baseRate = rateConfig.baseRate ?? record.tarifaHora ?? record.salarioHora ?? record.empleado?.salarioHora ?? 0;
  const extraRate = rateConfig.extraRate ?? (baseRate * 1.5);
  const noctRate = rateConfig.noctRate ?? (baseRate * 1.35);

  const costoTotal = +(
    horasTrabajadas * baseRate +
    horasExtras * extraRate +
    horasNocturnas * noctRate
  ).toFixed(2);

  return {
    horasTrabajadas,
    horasExtras,
    llegadaTarde,
    horasNocturnas,
    totalHoras,
    costoTotal,
  };
}
