import type { LegalStatus } from '@prisma/client';

interface BrandVigencyDotProps {
  expirationDate: Date | null;
  legalStatus: LegalStatus | string;
}

interface VigencyInfo {
  color: string;
  label: string;
}

function getVigencyInfo(
  expirationDate: Date | null,
  legalStatus: string
): VigencyInfo {
  // Statuses that override date-based logic
  if (legalStatus === 'CANCELLED') {
    return { color: '#C8C4B9', label: 'Cancelada' };
  }
  if (legalStatus === 'APPLIED' || legalStatus === 'PUBLISHED') {
    return { color: '#C8C4B9', label: 'Pendiente' };
  }
  if (legalStatus === 'EXPIRED') {
    return { color: '#B42318', label: 'Expirada' };
  }

  if (!expirationDate) {
    return { color: '#C8C4B9', label: 'Sin fecha de expiración' };
  }

  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { color: '#B42318', label: `Expirada hace ${Math.abs(diffDays)} dias` };
  }
  if (diffDays <= 30) {
    return { color: '#D39A2B', label: `Expira en ${diffDays} dias` };
  }
  if (diffDays <= 90) {
    return { color: '#D39A2B', label: `Expira en ${diffDays} dias` };
  }
  return { color: '#2F6B4F', label: `Expira en ${diffDays} dias` };
}

export function BrandVigencyDot({
  expirationDate,
  legalStatus,
}: BrandVigencyDotProps) {
  const { color, label } = getVigencyInfo(expirationDate, legalStatus);

  return (
    <span className="group relative inline-flex items-center" title={label}>
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

export { getVigencyInfo };
