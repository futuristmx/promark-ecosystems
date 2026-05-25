import { cn } from '@/lib/utils';

export type NodeType = 'input' | 'process' | 'output';

interface DsNodeCardProps {
  type: NodeType;
  title: string;
  /** Subtítulo o tipo más específico (e.g. "AI Agent", "Catálogo de marcas") */
  subtitle?: string;
  /** Metadatos chicos del footer (e.g. "13 registros · 2 tenants") */
  meta?: string;
  /** Icon a la izquierda del title */
  icon?: React.ReactNode;
  /** Status badge interno opcional */
  status?: React.ReactNode;
  /** Si el nodo es seleccionable / clickeable */
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const TYPE_CONFIG: Record<
  NodeType,
  { color: string; label: string; bgGlow: string }
> = {
  input: {
    color: '#0284C7', // cyan
    label: 'Input',
    bgGlow:
      'radial-gradient(circle at right center, rgba(2, 132, 199, 0.06), transparent 60%)',
  },
  process: {
    color: '#0066FF', // electric
    label: 'Proceso',
    bgGlow:
      'radial-gradient(circle at right center, rgba(0, 102, 255, 0.06), transparent 60%)',
  },
  output: {
    color: '#EA580C', // orange
    label: 'Output',
    bgGlow:
      'radial-gradient(circle at right center, rgba(234, 88, 12, 0.06), transparent 60%)',
  },
};

/**
 * Node card del design system para canvas / workflow / pipelines.
 *
 * Tres tipos visuales con accent color propio:
 * - `input` cyan
 * - `process` electric blue
 * - `output` orange
 *
 * Usar dentro de `<DsWorkflowCanvas>` para flujos visuales, o standalone
 * para representar un paso/agente/agentificación.
 */
export function DsNodeCard({
  type,
  title,
  subtitle,
  meta,
  icon,
  status,
  selected = false,
  onClick,
  className,
  children,
}: DsNodeCardProps) {
  const config = TYPE_CONFIG[type];

  return (
    <div
      className={cn(
        'group min-w-[200px] rounded-xl border bg-white transition-all duration-200',
        selected
          ? 'shadow-md ring-2 ring-offset-2'
          : 'border-slate-200/60 hover:border-slate-300',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        background: `${config.bgGlow}, #FFFFFF`,
        ...(selected
          ? {
              borderColor: config.color,
              boxShadow: `0 0 0 1px ${config.color}40, 0 4px 12px ${config.color}20`,
            }
          : {}),
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Type label */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        {status && <span className="text-[11px]">{status}</span>}
      </div>

      {/* Body */}
      <div className="px-3 py-3">
        <div className="flex items-start gap-2">
          {icon && (
            <span
              className="mt-0.5 flex size-7 items-center justify-center rounded-md text-white"
              style={{ background: config.color }}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {title}
            </p>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {children && <div className="mt-3">{children}</div>}

        {meta && (
          <p className="mt-3 text-[11px] text-slate-400">{meta}</p>
        )}
      </div>
    </div>
  );
}
