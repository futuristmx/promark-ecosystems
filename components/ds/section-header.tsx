import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  hint?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Header de sección dentro de una página. Usar para separar bloques
 * (KPIs / Cards / Tabla / Detalle).
 */
export function SectionHeader({
  title,
  hint,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4 mt-12 flex items-baseline justify-between gap-3 first:mt-0',
        className
      )}
    >
      <div className="flex items-baseline gap-3">
        <h2 className="text-base font-semibold" style={{ color: '#1A1E23' }}>{title}</h2>
        {hint && (
          <span className="text-sm" style={{ color: '#355B6F' }}>{hint}</span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
