# Phase 4.4 — payment links

The organization owner can create or revoke a seven-day link in the receivable
details. The URL is returned once by the API and can be copied or included in a
manual WhatsApp reminder after checking the customer. Creating another link
replaces the previous one. The private public page at `/pagar#token=...` resolves
the token in a POST request, without cookies or external QR services.

The page displays only the business name, configured recipient, outstanding
amount, QR Code and Pix Copia e Cola. It is not indexed or cached. A new page
load or the refresh button checks the current status. The displayed code
is a snapshot: previously copied static Pix cannot be revoked. The customer
must verify the amount and actual bank recipient and avoid paying twice.
There is no automatic payment confirmation, payment record or provider.

Requires the phase 4.4 API and its migration, deployed first. No additional
frontend dependencies or environment variables. The API's configured frontend
origin must match the application origin. Verify creation, replacement,
revocation, expiry, changes to balance/destination, owner access, tenant scope,
WhatsApp recipient and mobile/clipboard behavior before release.
