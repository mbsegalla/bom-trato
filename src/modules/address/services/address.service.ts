import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';
import { normalizeBrazilianPostalCode } from '@/shared/formatters/postalCode.formatter';

import {
  addressLookupResponseSchema,
  brazilianCitiesResponseSchema,
  brazilianStatesResponseSchema,
} from '../schemas/address.schema';
import type { AddressLookup, BrazilianCity, BrazilianState } from '../types/address.types';

const postalCodeFlights = new Map<string, Promise<AddressLookup>>();

const citiesFlights = new Map<string, Promise<BrazilianCity[]>>();

let statesFlight: Promise<BrazilianState[]> | null = null;

function addressErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'Informe um CEP ou estado válido.';

    case 404:
      return 'CEP não encontrado.';

    case 502:
    case 503:
      return 'O serviço de endereços está temporariamente indisponível.';

    default:
      return fallback;
  }
}

async function requestAddress(postalCode: string): Promise<AddressLookup> {
  const normalized = normalizeBrazilianPostalCode(postalCode);

  const response = await authenticatedFetch(`/api/address/postal-codes/${encodeURIComponent(normalized)}`);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(addressErrorMessage(response.status, 'Não foi possível consultar o CEP.'));
  }

  const payload: unknown = await response.json();

  const parsed = addressLookupResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o endereço retornado.');
  }

  return parsed.data;
}

export function findAddressByPostalCode(postalCode: string): Promise<AddressLookup> {
  const normalized = normalizeBrazilianPostalCode(postalCode);

  const existing = postalCodeFlights.get(normalized);

  if (existing) {
    return existing;
  }

  const request = requestAddress(normalized);

  postalCodeFlights.set(normalized, request);

  const cleanup = () => {
    if (postalCodeFlights.get(normalized) === request) {
      postalCodeFlights.delete(normalized);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function requestStates(): Promise<BrazilianState[]> {
  const response = await authenticatedFetch('/api/address/states');

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(addressErrorMessage(response.status, 'Não foi possível carregar os estados.'));
  }

  const payload: unknown = await response.json();

  const parsed = brazilianStatesResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os estados retornados.');
  }

  return parsed.data;
}

export function listBrazilianStates(): Promise<BrazilianState[]> {
  if (statesFlight) {
    return statesFlight;
  }

  const request = requestStates();

  statesFlight = request;

  const cleanup = () => {
    if (statesFlight === request) {
      statesFlight = null;
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function requestCities(state: string): Promise<BrazilianCity[]> {
  const normalized = state.trim().toUpperCase();

  const response = await authenticatedFetch(`/api/address/states/${encodeURIComponent(normalized)}/cities`);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(addressErrorMessage(response.status, 'Não foi possível carregar as cidades.'));
  }

  const payload: unknown = await response.json();

  const parsed = brazilianCitiesResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar as cidades retornadas.');
  }

  return parsed.data;
}

export function listBrazilianCities(state: string): Promise<BrazilianCity[]> {
  const normalized = state.trim().toUpperCase();

  const existing = citiesFlights.get(normalized);

  if (existing) {
    return existing;
  }

  const request = requestCities(normalized);

  citiesFlights.set(normalized, request);

  const cleanup = () => {
    if (citiesFlights.get(normalized) === request) {
      citiesFlights.delete(normalized);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}
