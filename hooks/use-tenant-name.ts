import { useState, useEffect } from 'react';

const cache = new Map<string, string>();

export function useTenantName(tenantId: string): string {
  const [name, setName] = useState(() => cache.get(tenantId) ?? '');

  useEffect(() => {
    if (cache.has(tenantId)) {
      setName(cache.get(tenantId)!);
      return;
    }

    let cancelled = false;
    fetch(`/api/tenants/${tenantId}/info`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.name) {
          cache.set(tenantId, data.name);
          setName(data.name);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return name;
}
