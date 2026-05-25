import { cn } from '@/lib/utils';

interface PageTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Header de página estándar del design system.
 *
 * Estructura editorial: eyebrow (electric blue uppercase) → title → subtitle.
 * Las acciones se alinean a la derecha en flex.
 */
export function PageTitle({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: PageTitleProps) {
  return (
    <header
      className={cn(
        'mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end',
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0066FF]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}
