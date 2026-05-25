import { cn } from '@/lib/utils';

interface DsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante visual del card */
  variant?: 'standard' | 'premium' | 'atmospheric';
  /** Tamaño del padding interior */
  padding?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * Componente base de card del design system. Tres variantes:
 *
 * - `standard` — flat, contraste por color (#EDEFF3 vs bg blanco)
 * - `premium`  — gradient navy top-left + electric blue bottom-right
 * - `atmospheric` — gradients pink/orange/electric (AI / módulos creativos)
 */
export function DsCard({
  variant = 'standard',
  padding = 'md',
  className,
  children,
  ...props
}: DsCardProps) {
  const variantClass = {
    standard: 'ds-card',
    premium: 'ds-card-premium',
    atmospheric: 'ds-card-atmospheric',
  }[variant];

  const paddingClass = {
    sm: 'p-4',
    md: '', // default from .ds-card classes (24-28px)
    lg: 'p-8',
  }[padding];

  return (
    <div className={cn(variantClass, paddingClass, className)} {...props}>
      {children}
    </div>
  );
}
