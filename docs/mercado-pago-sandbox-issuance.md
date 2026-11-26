# Phase 4.5.3b — sandbox Pix issuance

An owner-only panel in the receivable details displays Mercado Pago sandbox
issuance. It is hidden when the API reports the feature disabled and no
previous issuance exists. Use only test organizations, test receivables and
test buyers. The user explicitly confirms test issuance. Test email/document
fields stay in component state only and are cleared after submission.

The API determines the exact outstanding BRL amount, account, expiration and
reservation reference. The UI shows the locally recorded outcome, renders a
pending QR locally with the existing QR helper, and hides the code on expiry,
receivable version change, reload or organization switch. No third-party QR
image requests. A manual status refresh is a local read, not a provider
settlement query. Uncertain outcomes and expired or stale reservations cannot
be reissued. No sharing link, real payment, automatic ledger update or
provider reconciliation is implemented in this increment.

Deploy the backend migration and enable the sandbox-only feature flag in a
segregated test environment. No frontend variables or dependencies were added.
Verify the provider test-account behavior and the browser flow before release.
