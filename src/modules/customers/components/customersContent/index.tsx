'use client';

import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';

import { ListContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { CustomerFormPanel } from '@/modules/customers/components/customerFormPanel';
import { listCustomers } from '@/modules/customers/services/customer.service';
import type { CustomerPage, CustomerStatus } from '@/modules/customers/types/customer.types';

import { CustomersEmptyState } from './components/customersEmptyState';
import { CustomersHeader } from './components/customersHeader';
import { CustomersTable } from './components/customersTable';
import { CustomersToolbar } from './components/customersToolbar';

interface CustomerListState {
  requestKey: string;
  data: CustomerPage;
}

interface CustomerListErrorState {
  requestKey: string;
  message: string;
}

export function CustomersContent() {
  const { activeOrganization } = useApp();

  return <OrganizationCustomersContent key={activeOrganization.id} organizationId={activeOrganization.id} />;
}

function OrganizationCustomersContent({ organizationId }: { organizationId: string }) {
  const router = useRouter();

  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('ACTIVE');
  const [page, setPage] = useState(1);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [listState, setListState] = useState<CustomerListState | null>(null);
  const [errorState, setErrorState] = useState<CustomerListErrorState | null>(null);

  const requestKey = `${organizationId}:${page}:${status}:${search}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    void listCustomers(organizationId, { page, status, search })
      .then((result) => {
        if (!active) return;

        setErrorState(null);
        setListState({ requestKey, data: result });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setErrorState({
          requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar seus clientes.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, page, requestKey, router, search, status, refreshVersion]);

  const data = listState?.requestKey === requestKey ? listState.data : null;
  const error = errorState?.requestKey === requestKey ? errorState.message : null;

  const handleSearch: NonNullable<ComponentProps<'form'>['onSubmit']> = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  };

  function changeStatus(nextStatus: CustomerStatus): void {
    if (status === nextStatus) return;
    setPage(1);
    setStatus(nextStatus);
  }

  function handleSaved(): void {
    setPage(1);
    setRefreshVersion((value) => value + 1);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <CustomersHeader onCreate={() => setFormOpen(true)} />

      <section className="mt-8 rounded-2xl border border-border bg-card shadow-sm">
        <CustomersToolbar
          searchDraft={searchDraft}
          search={search}
          status={status}
          onSearchDraftChange={setSearchDraft}
          onSubmitSearch={handleSearch}
          onClearSearch={() => {
            setSearchDraft('');
            setSearch('');
            setPage(1);
          }}
          onStatusChange={changeStatus}
        />

        {error ? (
          <div className="p-8 text-center">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => setRefreshVersion((value) => value + 1)}
              className="mt-5 min-h-11 cursor-pointer rounded-xl"
            >
              Tentar novamente
            </Button>
          </div>
        ) : !data ? (
          <ListContentSkeleton columns={5} rows={6} label="Carregando clientes" />
        ) : data.items.length === 0 ? (
          <CustomersEmptyState search={search} status={status} onCreate={() => setFormOpen(true)} />
        ) : (
          <CustomersTable
            data={data}
            page={page}
            onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
            onNextPage={() => setPage((value) => value + 1)}
          />
        )}
      </section>

      {formOpen && (
        <CustomerFormPanel organizationId={organizationId} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
