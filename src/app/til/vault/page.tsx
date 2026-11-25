'use client';

import React, { Suspense } from 'react';
import TilPage from '../page';

export default function TilVaultPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center font-mono text-xs text-gray-500">OPENING VAULT...</div>}>
      <TilPage />
    </Suspense>
  );
}
