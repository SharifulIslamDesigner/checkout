'use client';

import { Suspense } from 'react';
import ProgressBar from './ProgressBar';

export default function ProgressBarWrapper() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}