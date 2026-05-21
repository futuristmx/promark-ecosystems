import Link from 'next/link';
import { requirePromarkAuth } from '@/lib/auth/promark';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tenants', label: 'Tenants' },
];

export default async function PromarkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePromarkAuth();

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-700 px-6">
          <span className="text-xl font-bold tracking-tight">
            Promark<span className="text-blue-400">&reg;</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-700 p-4">
          <p className="truncate text-sm font-medium text-white">
            {session.full_name}
          </p>
          <p className="text-xs text-slate-400">{session.role}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {children}
      </main>
    </div>
  );
}
