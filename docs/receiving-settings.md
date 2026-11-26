# Phase 4.2 — receiving settings

Open Settings > Recebimentos (`/settings?tab=receiving`). Only the current organization owner loads or edits the private destination. The existing subscription and payment-method settings remain unchanged.

The form accepts CPF, CNPJ, international phone, email and random Pix keys. Confirm the destination in the bank before saving. Changing any field resets confirmation; disabling Pix and saving removes the key and merchant labels. The backend validates syntax and normalizes the values, returns the version, and encrypts the key at rest. The page does not create payment codes, collect money, verify a bank account, or expose the settings to clients.

Deploy the API migration and configure the API-only encryption secret first (see backend `docs/receiving-settings.md`). Never copy the secret into frontend environment variables. No frontend dependencies are added.

Before merging, verify owner/non-owner and organization switching, all five key types, stale version conflicts, disabled API configuration, save/remove, subscription tab unaffected, and that no customer-facing page displays the key. Run `pnpm check` and `pnpm build`.
