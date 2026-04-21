'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TransactionEditPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  useEffect(() => {
    // TODO: Implement transaction edit functionality
    // For now, redirect to detail page
    router.replace(`/transactions/${transactionId}`);
  }, [router, transactionId]);

  return null;
}
