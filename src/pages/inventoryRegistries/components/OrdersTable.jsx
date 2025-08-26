import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchOrders } from '../services/orders.services';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const OrdersTable = ({ idLavanderia, refreshKey = 0 }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!idLavanderia) return;
    setLoading(true);
    try {
      const res = await fetchOrders({ lavanderiaId: idLavanderia });
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error('Error obteniendo pedidos:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [idLavanderia]);

  useEffect(() => { load(); }, [load, idLavanderia, refreshKey]);

  const items = useMemo(() => rows.map(r => ({
    id: r._id || r.id,
    numeroPedido: r.numeroPedido,
    fecha: r.fecha ? new Date(r.fecha) : null,
    producto: r?.producto?.nombre || '',
    cantidad: Number(r?.cantidad ?? 0),
    litrosTotal: Number(r?.litrosTotal ?? 0),
    estado: r?.estado || 'Pendiente',
  })), [rows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pedidos</CardTitle>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cargando</>) : 'Actualizar'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead># Pedido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Litros totales</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Sin pedidos.</TableCell>
                </TableRow>
              ) : (
                items.map(it => (
                  <TableRow key={it.id || it.numeroPedido}>
                    <TableCell className="font-medium">{it.numeroPedido}</TableCell>
                    <TableCell>{it.fecha ? it.fecha.toLocaleString() : '-'}</TableCell>
                    <TableCell>{it.producto}</TableCell>
                    <TableCell className="text-right">{it.cantidad}</TableCell>
                    <TableCell className="text-right">{it.litrosTotal}</TableCell>
                    <TableCell>{it.estado}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
