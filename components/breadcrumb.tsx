import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  tooltip?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: '#C8C4B9' }} />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-[#8FB6C7] transition-colors hover:text-[#355B6F]"
                title={item.tooltip}
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold" style={{ color: '#0F2E3D' }}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
