import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { sendSummaryEmail } from '../services/shifts.services';
import { useToast } from '@/components/ui/use-toast';

export default function WeeklySummaryModal({ open, onClose, summary, employee }) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const printableHtml = useMemo(() => {
    if (!summary) return '';
    const rows = summary.perDay.map((d) => `
      <tr>
        <td style="padding:4px 8px;border:1px solid #ccc">${d.date}</td>
        <td style="padding:4px 8px;border:1px solid #ccc">${d.totalHours} h</td>
        <td style=\"padding:4px 8px;border:1px solid #ccc\">${d.extraHours ? d.extraHours : 0} h</td>
        <td style="padding:4px 8px;border:1px solid #ccc">${d.lunch ? `${d.lunch.start} - ${d.lunch.end}` : '-'}</td>
        <td style="padding:4px 8px;border:1px solid #ccc">${d.blocks.length ? d.blocks.map((b,i)=>`Bloque ${i+1}: ${b.start}-${b.end} (${b.hours} h)${b.type==='extra' ? ' Extras' : ''}`).join('<br/>') : 'Sin bloques'}</td>
      </tr>
    `).join('');
    return `
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>Resumen semanal</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h1 { font-size: 18px; margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            th { background: #f7f7f7; }
          </style>
        </head>
        <body>
          <h1>Resumen semanal ${employee?.name ? `- ${employee.name}` : ''}</h1>
          <p>
            <strong>Base:</strong> ${summary.weeklyBase ?? summary.weeklyTotal ?? 0} h
            &nbsp;•&nbsp;
            <strong>Extra:</strong> ${summary.weeklyExtra ?? 0} h
            &nbsp;•&nbsp;
            <strong>Total:</strong> ${summary.weeklyTotal ?? ((summary.weeklyBase ?? 0) + (summary.weeklyExtra ?? 0))} h
          </p>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Horas base</th>
                <th>Horas extra</th>
                <th>Almuerzo</th>
                <th>Bloques</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }, [summary, employee]);

  const handlePrint = () => {
    if (!summary) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(printableHtml);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  };

  const handleSendEmail = async () => {
    if (!summary || !employee) return;
    setIsSending(true);
    try {
      // Construir "dias" para el backend desde la previsualización (usa bloques ya en HH:mm)
      const dias = summary.perDay
        .map((d) => {
          const horaInicio = d.blocks.length ? d.blocks[0].start : (d.lunch?.start || '00:00');
          const horaFin = d.blocks.length ? d.blocks[d.blocks.length - 1].end : (d.lunch?.end || '00:00');
          return {
            fecha: d.date,
            horaInicio,
            horaFin,
            tieneAlmuerzo: Boolean(d.lunch),
          };
        })
        .filter((d) => d.horaInicio !== '00:00' || d.horaFin !== '00:00');

      const empleado = {
        id: employee.id,
        nombre: employee.name,
        cedula: employee.cedula,
        celular: employee.celular,
        salario: employee.salario,
        correo: employee.correo,
        diaDescanso: employee.dayOff,
      };

      // No tenemos nombre de lavandería aquí; enviamos sólo id si está disponible en el contexto superior.
      const lavanderia = employee.lavanderia || null;

      await sendSummaryEmail({ empleado, lavanderia, dias });
      toast({ title: 'Enviado', description: 'Resumen enviado al correo del empleado.' });
      onClose(false);
    } catch (error) {
      toast({
        title: 'Error al enviar',
        description: error?.message || 'No se pudo enviar el resumen por correo.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleWhatsApp = () => {
    if (!summary) return;
    const lines = [];
    lines.push(`Resumen semanal${employee?.name ? ` - ${employee.name}` : ''}`);
    const base = summary.weeklyBase ?? summary.weeklyTotal ?? 0;
    const extra = summary.weeklyExtra ?? 0;
    const total = summary.weeklyTotal ?? (base + extra);
    lines.push(`Base: ${base} h • Extra: ${extra} h • Total: ${total} h`);
    for (const d of summary.perDay) {
      lines.push(`\n${d.date} - ${d.totalHours} h base${d.extraHours ? ` • ${d.extraHours} h extra` : ''}`);
      if (d.lunch) lines.push(`  Almuerzo: ${d.lunch.start}-${d.lunch.end}`);
      if (d.blocks.length) {
        for (let i=0;i<d.blocks.length;i++) {
          const b = d.blocks[i];
          lines.push(`  Bloque ${i+1}: ${b.start}-${b.end} (${b.hours} h)${b.type==='extra' ? ' Extras' : ''}`);
        }
      } else {
        lines.push('  Sin bloques');
      }
    }
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resumen semanal {employee?.name ? `- ${employee.name}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <span className="mr-3"><span className="font-bold">Base:</span> <span className="font-semibold text-foreground">{summary?.weeklyBase ?? summary?.weeklyTotal ?? 0} h</span></span>
            <span className="mr-3"><span className="font-bold">Extra:</span> <span className="font-semibold text-foreground">{summary?.weeklyExtra ?? 0} h</span></span>
            <span><span className="font-bold">Total:</span> <span className="font-semibold text-foreground">{summary?.weeklyTotal ?? ((summary?.weeklyBase ?? 0) + (summary?.weeklyExtra ?? 0))} h</span></span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {summary?.perDay?.map(d => (
              <div key={d.date} className="border rounded-md p-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{d.date}</span>
                  <span>{d.totalHours} h</span>
                </div>
                {d.lunch && (
                  <div className="text-xs text-muted-foreground mt-1">Almuerzo: {d.lunch.start} - {d.lunch.end}</div>
                )}
                <ul className="mt-2 space-y-1">
                  {d.blocks.length ? d.blocks.map((b, idx) => (
                    <li key={idx} className="text-xs">
                      Bloque {idx+1}: {b.start} - {b.end} ({b.hours} h){b.type==='extra' ? ' Extras' : ''}
                    </li>
                  )) : (
                    <li className="text-xs text-muted-foreground">Sin bloques</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? 'Enviando…' : 'Enviar por correo'}
            </Button>
            <Button variant="secondary" onClick={handleWhatsApp}>Enviar por WhatsApp</Button>
            <Button variant="secondary" onClick={handlePrint}>Imprimir</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onClose(false)}>Cerrar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
