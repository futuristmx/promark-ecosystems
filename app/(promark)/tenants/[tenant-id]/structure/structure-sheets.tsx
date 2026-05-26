'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { HoldingFormSheet } from './holding-form-sheet';
import { CompanyFormSheet } from './company-form-sheet';

interface HoldingInfo {
  id: string;
  name: string;
}

interface StructureSheetsProps {
  tenantId: string;
  holdings: HoldingInfo[];
}

export function StructureSheets({ tenantId, holdings }: StructureSheetsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const action = searchParams.get('action');
  const holdingParam = searchParams.get('holding');

  function close() {
    router.replace(pathname);
  }

  const holdingForCompany = holdings.find((h) => h.id === holdingParam);

  return (
    <>
      <HoldingFormSheet
        tenantId={tenantId}
        open={action === 'new-holding'}
        onClose={close}
      />
      {holdingForCompany && (
        <CompanyFormSheet
          tenantId={tenantId}
          holdingId={holdingForCompany.id}
          holdingName={holdingForCompany.name}
          open={action === 'new-company'}
          onClose={close}
        />
      )}
    </>
  );
}
