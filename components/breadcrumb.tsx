import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm text-slate-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-slate-900"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
