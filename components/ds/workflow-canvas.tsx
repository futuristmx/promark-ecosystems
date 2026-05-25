import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface DsWorkflowCanvasProps {
  /** Layout horizontal con flechas conectoras */
  variant?: 'horizontal' | 'vertical';
  /** Nodes a renderizar (típicamente DsNodeCard) */
  children: React.ReactNode;
  /** Mostrar título arriba */
  title?: string;
  /** Subtítulo */
  description?: string;
  className?: string;
}

/**
 * Workflow canvas premium del DS para visualizar flujos lineales.
 *
 * Renderiza children con flechas conectoras entre ellos. Para flujos
 * más complejos (ramificaciones, ciclos, drag-and-drop), usar
 * `@xyflow/react` directamente — este canvas es para flujos editorial
 * simples (Input → Proceso → Output).
 *
 * Layout:
 * - `horizontal` (default): nodos en fila con `→`
 * - `vertical`: nodos en columna con `↓`
 */
export function DsWorkflowCanvas({
  variant = 'horizontal',
  children,
  title,
  description,
  className,
}: DsWorkflowCanvasProps) {
  const childArr = Array.isArray(children) ? children : [children];
  // Filter out null/undefined children
  const validChildren = childArr.filter(Boolean);

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/60 bg-white p-6',
        className
      )}
    >
      {(title || description) && (
        <div className="mb-5">
          {title && (
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
      )}

      <div
        className={cn(
          'flex items-stretch gap-4',
          variant === 'horizontal'
            ? 'flex-row flex-wrap items-center'
            : 'flex-col'
        )}
      >
        {validChildren.map((child, index) => (
          <div
            key={index}
            className={cn(
              variant === 'horizontal'
                ? 'flex items-center gap-4'
                : 'flex flex-col items-center gap-2'
            )}
          >
            {child}
            {index < validChildren.length - 1 && (
              <ChevronRight
                className={cn(
                  'shrink-0 text-slate-300',
                  variant === 'horizontal' ? 'size-5' : 'size-5 rotate-90'
                )}
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
