import { Suspense } from "react";
import { LedgerView } from "./LedgerView";

export default function LedgerPage() {
  return (
    <Suspense fallback={null}>
      <LedgerView />
    </Suspense>
  );
}
