import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/DataTable';
import { PlusCircle, Edit, Trash2, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { fetchStatusTemplates, createStatusTemplate, updateStatusTemplate, deleteStatusTemplate, exportStatusTemplates } from './Services/status-templates.services.jsx';

const ICON_OPTIONS = [
  'CircleDot','CheckCircle2','Truck','Package','AlertCircle','Info','Flag','MapPin','Ship','Plane','Clock','CalendarClock',
  'AlertTriangle','AlertOctagon','Ban','Skull','Flame'
];

const columns = [
  { id: 'titulo', label: 'Título', accessor: (row) => row.titulo, sortable: true },
  { id: 'descripcion', label: 'Descripción', accessor: (row) => row.descripcion, sortable: false },
  { id: 'icono', label: 'Ícono', accessor: (row) => row.icono, sortable: true },
  { id: 'actions', label: 'Acciones', type: 'actions', actions: [
    { id: 'edit', label: 'Editar', icon: 'Edit', className: 'text-green-600 hover:text-white hover:bg-green-600' },
    { id: 'delete', label: 'Eliminar', icon: 'Trash', className: 'text-red-600 hover:text-white hover:bg-red-600' },
  ] },
];

export default function StatusTemplatesPage() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '', icono: 'CircleDot' });

  const resetForm = () => setForm({ titulo: '', descripcion: '', icono: 'CircleDot' });

  const load = async () => {
    setIsLoading(true);
    try {
      const resp = await fetchStatusTemplates({ limit: itemsPerPage, offset: currentPage, query: {} });
      const items = resp?.data || resp?.items || [];
      setRows(items);
      setTotalItems(resp?.totalRecords || items.length || 0);
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'No fue posible cargar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentPage, itemsPerPage]);

  const onAction = async (action, row) => {
    if (action === 'edit') {
      setEditing(row);
      setForm({ titulo: row.titulo || '', descripcion: row.descripcion || '', icono: row.icono || 'CircleDot' });
      setIsModalOpen(true);
    } else if (action === 'delete') {
      if (!confirm('¿Eliminar plantilla?')) return;
      try {
        await deleteStatusTemplate(row._id || row.id);
        toast({ title: 'Eliminado', description: 'Plantilla eliminada' });
        load();
      } catch (e) {
        toast({ title: 'Error', description: e.message || 'No se pudo eliminar', variant: 'destructive' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, titulo: (form.titulo || '').trim(), icono: (form.icono || 'CircleDot').trim() };
    if (!payload.titulo) return toast({ title: 'Valida', description: 'El título es requerido', variant: 'destructive' });
    try {
      if (editing?._id || editing?.id) {
        await updateStatusTemplate(editing._id || editing.id, payload);
        toast({ title: 'Actualizado', description: 'Plantilla actualizada' });
      } else {
        await createStatusTemplate(payload);
        toast({ title: 'Creado', description: 'Plantilla creada' });
      }
      setIsModalOpen(false);
      setEditing(null);
      resetForm();
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'No se pudo guardar', variant: 'destructive' });
    }
  };

  const exportAll = async () => {
    try {
      const data = await exportStatusTemplates({ query: {} });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'status-templates.json'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo exportar', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Estados de Operación</CardTitle>
            <CardDescription>Gestione plantillas con título, descripción e ícono</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setEditing(null); resetForm(); setIsModalOpen(true); }} className="bg-sky-600 hover:bg-sky-700">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuevo
            </Button>
            <Button variant="secondary" onClick={exportAll}>
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={rows}
            columns={columns}
            isLoading={isLoading}
            onAction={onAction}
            page={currentPage}
            limit={itemsPerPage}
            totalRecords={totalItems}
            onPageChange={setCurrentPage}
            onLimitChange={setItemsPerPage}
          />
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">{editing ? 'Editar' : 'Nueva'} plantilla</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} required />
              </div>
              <div>
                <Label>Descripción</Label>
                <Input value={form.descripcion} onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <div>
                <Label>Ícono</Label>
                <Select value={form.icono} onValueChange={(v) => setForm(f => ({ ...f, icono: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona ícono" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-sky-600 hover:bg-sky-700">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
