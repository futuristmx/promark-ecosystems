import { requirePromarkAuth } from '@/lib/auth/promark';
import { PromarkSidebar } from '@/components/promark-sidebar';

export default async function PromarkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePromarkAuth();

  return (
    <div className="flex h-full min-h-screen bg-background">
      <PromarkSidebar userName={session.full_name} userRole={session.role} />
      <main className="flex-1 overflow-y-auto px-10 py-8">
        {children}
      </main>
    </div>
  );
}
