'use client';

import { LoaderCircle, MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  findAddressByPostalCode,
  listBrazilianCities,
  listBrazilianStates,
} from '@/modules/address/services/address.service';
import type { BrazilianCity, BrazilianState } from '@/modules/address/types/address.types';
import { SessionError } from '@/modules/auth/services/session.service';
import {
  formatBrazilianPostalCode,
  formatBrazilianPostalCodeInput,
  normalizeBrazilianPostalCode,
} from '@/shared/formatters/postalCode.formatter';

import type { BusinessProfile } from '../../../types/business.types';

interface BusinessAddressFieldsProps {
  profile: BusinessProfile;
  owner: boolean;
}

interface StatesState {
  items: BrazilianState[];
  error: string | null;
}

interface CitiesState {
  stateCode: string;
  items: BrazilianCity[];
  error: string | null;
}

export function BusinessAddressFields({ profile, owner }: BusinessAddressFieldsProps) {
  const router = useRouter();

  const [postalCode, setPostalCode] = useState(formatBrazilianPostalCode(profile.postalCode));
  const [addressLine1, setAddressLine1] = useState(profile.addressLine1 ?? '');
  const [addressLine2, setAddressLine2] = useState(profile.addressLine2 ?? '');
  const [state, setState] = useState(profile.state ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [statesState, setStatesState] = useState<StatesState | null>(null);
  const [citiesState, setCitiesState] = useState<CitiesState | null>(null);
  const [lookingUpPostalCode, setLookingUpPostalCode] = useState(false);
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [postalCodeFeedback, setPostalCodeFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listBrazilianStates()
      .then((items) => {
        if (!active) {
          return;
        }

        setStatesState({
          items,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        setStatesState({
          items: [],
          error: cause instanceof Error ? cause.message : 'Não foi possível carregar os estados.',
        });
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!state) {
      return;
    }

    let active = true;

    const stateCode = state;

    void listBrazilianCities(stateCode)
      .then((items) => {
        if (!active) {
          return;
        }

        setCitiesState({
          stateCode,
          items,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        setCitiesState({
          stateCode,
          items: [],
          error: cause instanceof Error ? cause.message : 'Não foi possível carregar as cidades.',
        });
      });

    return () => {
      active = false;
    };
  }, [router, state]);

  const states = statesState?.items ?? [];

  const statesLoading = statesState === null;

  const statesError = statesState?.error ?? null;

  const currentCitiesState = citiesState?.stateCode === state ? citiesState : null;

  const cities = state ? (currentCitiesState?.items ?? []) : [];

  const citiesLoading = state.length > 0 && currentCitiesState === null;

  const citiesError = currentCitiesState?.error ?? null;

  function changeState(nextState: string): void {
    setState(nextState);
    setCity('');
    setPostalCodeFeedback(null);
  }

  async function lookupPostalCode(): Promise<void> {
    if (!owner || lookingUpPostalCode) {
      return;
    }

    const normalized = normalizeBrazilianPostalCode(postalCode);

    if (normalized.length !== 8) {
      setPostalCodeError('Informe um CEP com 8 dígitos.');

      return;
    }

    setLookingUpPostalCode(true);
    setPostalCodeError(null);
    setPostalCodeFeedback(null);

    try {
      const address = await findAddressByPostalCode(normalized);

      setPostalCode(formatBrazilianPostalCode(address.postalCode));

      if (address.street) {
        setAddressLine1(address.street);
      }

      setState(address.state);
      setCity(address.city);

      const location = address.neighborhood
        ? `${address.neighborhood}, ${address.city}/${address.state}`
        : `${address.city}/${address.state}`;

      setPostalCodeFeedback(
        `Endereço encontrado: ${location}. Confira o logradouro e informe o número, se necessário.`,
      );
    } catch (cause: unknown) {
      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      setPostalCodeError(cause instanceof Error ? cause.message : 'Não foi possível consultar o CEP.');
    } finally {
      setLookingUpPostalCode(false);
    }
  }

  const hasCurrentStateOutsideOptions = state.length > 0 && !states.some((item) => item.code === state);
  const hasCurrentCityOutsideOptions = city.length > 0 && !cities.some((item) => item.name === city);

  return (
    <div className="space-y-5 sm:col-span-2">
      <div className="flex items-center gap-2 border-t border-border pt-6">
        <MapPin aria-hidden="true" className="size-4 text-primary" />

        <h3 className="font-medium">Endereço do negócio</h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="business-postal-code">CEP</Label>

          <div className="flex gap-2">
            <Input
              id="business-postal-code"
              name="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              value={postalCode}
              readOnly={!owner}
              maxLength={9}
              placeholder="00000-000"
              aria-invalid={postalCodeError ? true : undefined}
              onChange={(event) => {
                setPostalCode(formatBrazilianPostalCodeInput(event.currentTarget.value));
                setPostalCodeError(null);
                setPostalCodeFeedback(null);
              }}
              className="h-12 rounded-xl"
            />

            {owner && (
              <Button
                type="button"
                variant="outline"
                disabled={lookingUpPostalCode || normalizeBrazilianPostalCode(postalCode).length !== 8}
                onClick={() => void lookupPostalCode()}
                className="h-12 shrink-0 cursor-pointer rounded-xl px-4"
              >
                {lookingUpPostalCode ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Search aria-hidden="true" className="size-4" />
                )}
                Buscar CEP
              </Button>
            )}
          </div>

          {postalCodeError && (
            <p role="alert" className="text-sm text-destructive">
              {postalCodeError}
            </p>
          )}

          {postalCodeFeedback && (
            <p role="status" className="text-sm text-muted-foreground">
              {postalCodeFeedback}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="business-address-line-1">Endereço</Label>

          <Input
            id="business-address-line-1"
            name="addressLine1"
            autoComplete="street-address"
            value={addressLine1}
            readOnly={!owner}
            maxLength={150}
            placeholder="Rua, avenida e número"
            onChange={(event) => setAddressLine1(event.currentTarget.value)}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="business-address-line-2">Complemento</Label>

          <Input
            id="business-address-line-2"
            name="addressLine2"
            value={addressLine2}
            readOnly={!owner}
            maxLength={100}
            placeholder="Sala, bloco, referência"
            onChange={(event) => setAddressLine2(event.currentTarget.value)}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-state">Estado</Label>

          <select
            id="business-state"
            name="state"
            value={state}
            disabled={!owner || statesLoading}
            onChange={(event) => changeState(event.currentTarget.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            <option value="">{statesLoading ? 'Carregando estados...' : 'Selecione o estado'}</option>

            {hasCurrentStateOutsideOptions && <option value={state}>{state}</option>}

            {states.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>

          {statesError && (
            <p role="alert" className="text-sm text-destructive">
              {statesError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-city">Cidade</Label>

          <select
            id="business-city"
            name="city"
            value={city}
            disabled={!owner || !state || citiesLoading}
            onChange={(event) => setCity(event.currentTarget.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            <option value="">
              {!state ? 'Selecione primeiro o estado' : citiesLoading ? 'Carregando cidades...' : 'Selecione a cidade'}
            </option>

            {hasCurrentCityOutsideOptions && <option value={city}>{city}</option>}

            {cities.map((item) => (
              <option key={item.code} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          {citiesError && (
            <p role="alert" className="text-sm text-destructive">
              {citiesError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
