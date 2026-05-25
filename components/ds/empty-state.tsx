import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'card' | 'inline';
}

/**
 * Empty state reusable. Consolida ~5 implementaciones que existían
 * dispersas en el código.
 *
 * `variant="card"` envuelve en card con border-dashed.
 * `variant="inline"` solo contenido centrado sin envoltorio.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'card',
  className,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center text-center">
      {icon && (
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#EDEFF3] text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  if (variant === 'inline') {
    return <div className={cn('py-12', className)}>{content}</div>;
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white py-16 px-6',
        className
      )}
    >
      {content}
    </div>
  );
}
