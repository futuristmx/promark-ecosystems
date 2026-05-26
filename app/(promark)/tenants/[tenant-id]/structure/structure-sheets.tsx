'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { HoldingFormSheet } from './holding-form-sheet';
import { CompanyFormSheet } from './company-form-sheet';
import { EditHoldingSheet } from './edit-holding-sheet';
import { EditCompanySheet } from './edit-company-sheet';

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
  const idParam = searchParams.get('id');

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
      <EditHoldingSheet
        tenantId={tenantId}
        holdingId={idParam}
        open={action === 'edit-holding'}
        onClose={close}
      />
      <EditCompanySheet
        tenantId={tenantId}
        companyId={idParam}
        open={action === 'edit-company'}
        onClose={close}
      />
    </>
  );
}
