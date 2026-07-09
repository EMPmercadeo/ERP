import React from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { PayrollClient } from '@/components/payroll/PayrollClient';

export const dynamic = 'force-dynamic';

export default function PayrollPage() {
  return (
    <>
      <Topbar title="Planilla & RRHH (Ley 462 de 2025)" />
      <div className="p-6">
        <PayrollClient />
      </div>
    </>
  );
}
