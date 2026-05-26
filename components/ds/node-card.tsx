'use client';

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
    color: '#355B6F', // azul pizarra
    label: 'Input',
    bgGlow:
      'radial-gradient(circle at right center, rgba(53, 91, 111, 0.06), transparent 60%)',
  },
  process: {
    color: '#1C3F55', // indigo estratégico
    label: 'Proceso',
    bgGlow:
      'radial-gradient(circle at right center, rgba(28, 63, 85, 0.06), transparent 60%)',
  },
  output: {
    color: '#D39A2B', // ámbar
    label: 'Output',
    bgGlow:
      'radial-gradient(circle at right center, rgba(211, 154, 43, 0.06), transparent 60%)',
  },
};

/**
 * Node card del design system para canvas / workflow / pipelines.
 *
 * Tres tipos visuales con accent color propio:
 * - `input` azul pizarra
 * - `process` indigo estratégico
 * - `output` ámbar
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
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        background: `${config.bgGlow}, #FFFFFF`,
        borderColor: selected ? config.color : '#E2DED6',
        ...(selected
          ? {
              boxShadow: `0 0 0 1px ${config.color}40, 0 4px 12px ${config.color}20`,
            }
          : {}),
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Type label */}
      <div
        className="flex items-center justify-between border-b px-3 py-2"
        style={{ borderColor: '#F1EDE3' }}
      >
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
            <p className="truncate text-sm font-semibold" style={{ color: '#1A1E23' }}>
              {title}
            </p>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs" style={{ color: '#355B6F' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {children && <div className="mt-3">{children}</div>}

        {meta && (
          <p className="mt-3 text-[11px]" style={{ color: '#C8C4B9' }}>{meta}</p>
        )}
      </div>
    </div>
  );
}
