import React, { useEffect, useState } from 'react';
import * as documentsApi from '@/services/documentsService';

function formatGB(bytes) {
  return (bytes / (1000 ** 3)).toFixed(2);
}

export default function StorageUsageIndicator({ className = '', label = 'Uso de almacenamiento' }) {
  const [usage, setUsage] = useState({ totalBytes: 0, limitBytes: 10 * 1000 * 1000 * 1000, percent: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const percent = Math.min(100, usage?.percent || 0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const u = await documentsApi.getUsage();
        if (mounted) setUsage(u);
      } catch (e) {
        console.error('No se pudo obtener el uso de almacenamiento', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className={`mt-2 space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{loading ? 'Cargando…' : `${formatGB(usage.totalBytes)} GB / ${formatGB(usage.limitBytes)} GB`}</span>
      </div>
      <div className="h-2 w-full rounded bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
