import type { Metadata } from 'next';

import { CustomersContent } from '@/modules/customers/components/customersContent';

export const metadata: Metadata = {
  title: 'Clientes',
};

export default function CustomersPage() {
  return <CustomersContent />;
}
