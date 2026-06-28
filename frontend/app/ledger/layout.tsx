// Suspense wrapper required for useSearchParams() in Next.js App Router
import { Suspense } from 'react';
import LedgerPage from './page';

export default function LedgerLayout() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9ca3af] text-sm">Loading ledger…</p>
          </div>
        </div>
      }
    >
      <LedgerPage />
    </Suspense>
  );
}
