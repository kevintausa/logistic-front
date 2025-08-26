import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';

// Utilidad simple para hash (djb2)
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export default function UpdateNotifier({ checkIntervalMs = 60000 }) {
  const { toast } = useToast();
  const lastHashRef = useRef(null);
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchIndexHash() {
      try {
        // Evitar cache agresivo del navegador
        const res = await fetch('/index.html', { cache: 'no-store' });
        const text = await res.text();
        // Tomar solo una parte para rápido hashing
        const snippet = text.slice(0, 2000);
        return hashString(snippet);
      } catch (_e) {
        return null;
      }
    }

    async function checkForUpdate() {
      const newHash = await fetchIndexHash();
      if (!newHash) return;

      if (lastHashRef.current == null) {
        lastHashRef.current = newHash;
        return;
      }

      if (newHash !== lastHashRef.current && !hasAlertedRef.current) {
        hasAlertedRef.current = true;
        toast({
          title: 'Nueva versión disponible',
          description: 'Actualiza para obtener las últimas mejoras y correcciones.',
          duration: Infinity,
          action: (
            <ToastAction altText="Actualizar" onClick={() => window.location.reload(true)}>
              Actualizar
            </ToastAction>
          ),
        });
      }
    }

    // Chequeo inicial (no notifica, solo memoriza hash)
    (async () => {
      const initialHash = await fetchIndexHash();
      if (!cancelled && initialHash) {
        lastHashRef.current = initialHash;
      }
    })();

    // Intervalo periódico
    const id = setInterval(checkForUpdate, checkIntervalMs);

    // Chequear al volver a la pestaña
    const onVisibility = () => {
      if (!document.hidden) checkForUpdate();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [checkIntervalMs, toast]);

  return null;
}
