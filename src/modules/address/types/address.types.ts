import type { z } from 'zod';

import type { addressLookupSchema, brazilianCitySchema, brazilianStateSchema } from '../schemas/address.schema';

export type AddressLookup = z.infer<typeof addressLookupSchema>;

export type BrazilianState = z.infer<typeof brazilianStateSchema>;

export type BrazilianCity = z.infer<typeof brazilianCitySchema>;
