# Live Pix review and presentation

The live Mercado Pago panel is separate from the sandbox panel and appears
only to the organization owner. It is driven by the API's availability,
issuance/recovery permissions and current receivable version.

The form requires explicit confirmation of a real payment request and
authorized payer data. No request is sent while issuance is disabled.
A pending QR is visible only if the API returns a valid nonexpired code
for the exact current balance and version. Pending/processing state is
refetched every 15 seconds and copying requires a fresh server check.
Never present an expired, stale, settled or reviewed QR. The API remains
the authority; local status does not itself prove bank settlement.

The review action queries the existing reservation and can record a
verified settlement. It never creates another charge. Recovery and webhook
outcomes appear separately; sticky conflicts require operational review.

Deploy the matching API and its migration first. No new environment
variables or dependencies. Real issuance remains blocked by the API's
startup gate. Real-provider and browser acceptance are outstanding.
