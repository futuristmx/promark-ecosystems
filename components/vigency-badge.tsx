import { cn } from '@/lib/utils';

interface VigencyBadgeProps {
  expirationDate: Date | string | null | undefined;
  legalStatus: string;
  showLabel?: boolean;
}

function getVigencyInfo(
  expirationDate: Date | string | null | undefined,
  legalStatus: string
): { color: string; dotColor: string; label: string } {
  if (
    legalStatus === 'CANCELLED' ||
    legalStatus === 'OPPOSED' ||
    legalStatus === 'APPLIED' ||
    legalStatus === 'PUBLISHED'
  ) {
    return {
      color: 'bg-slate-100 text-slate-600',
      dotColor: 'bg-slate-400',
      label:
        legalStatus === 'CANCELLED'
          ? 'Cancelado'
          : legalStatus === 'OPPOSED'
            ? 'Opuesta'
            : 'Pendiente',
    };
  }

  if (!expirationDate) {
    return {
      color: 'bg-slate-100 text-slate-600',
      dotColor: 'bg-slate-400',
      label: 'Sin fecha',
    };
  }

  const now = new Date();
  const exp = new Date(expirationDate);
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      color: 'bg-red-50 text-red-700',
      dotColor: 'bg-red-500',
      label: 'Vencido',
    };
  }

  if (diffDays <= 30) {
    return {
      color: 'bg-orange-50 text-orange-700',
      dotColor: 'bg-orange-500',
      label: `Vence en ${diffDays} días`,
    };
  }

  if (diffDays <= 90) {
    return {
      color: 'bg-yellow-50 text-yellow-700',
      dotColor: 'bg-yellow-500',
      label: `Vence en ${diffDays} días`,
    };
  }

  return {
    color: 'bg-green-50 text-green-700',
    dotColor: 'bg-green-500',
    label: 'Vigente',
  };
}

export function VigencyBadge({
  expirationDate,
  legalStatus,
  showLabel = true,
}: VigencyBadgeProps) {
  const { color, dotColor, label } = getVigencyInfo(
    expirationDate,
    legalStatus
  );

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        color
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
      {showLabel && label}
    </span>
  );
}

export function VigencyDot({
  expirationDate,
  legalStatus,
}: Omit<VigencyBadgeProps, 'showLabel'>) {
  const { dotColor } = getVigencyInfo(expirationDate, legalStatus);
  return <span className={cn('inline-block h-2 w-2 rounded-full', dotColor)} />;
}
