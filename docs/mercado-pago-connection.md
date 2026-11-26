# Phase 4.5.2b — Mercado Pago account settings

Open Settings > Recebimentos as the organization owner. The Mercado Pago
panel is separate from the existing static Pix form and subscription.
It displays the configured environment, stored connection status, seller ID
and credential expiry. The feature is disabled by default on the API.

Connect redirects to the fixed Mercado Pago authorization origin after
validating the URL returned by the API. Register the exact HTTPS frontend
callback `/mercado-pago/callback` in the Mercado Pago application and enable
PKCE. The callback route moves the short-lived code and state into a
same-origin fragment, then the completion page removes the fragment from the
address bar and keeps it only in memory. Completion uses the existing
authenticated API; the server determines the organization from the state
and requires the initiating session. A reload or lost session requires a
new authorization. No tokens or verifier are stored in the browser.

The callback and completion routes have no-store, no-referrer and noindex
headers. Hosting/proxy access logs must redact the callback query string.
No third-party tracking scripts should be added to these routes.

Disconnect removes the local credentials, not provider consent; revoke
the application in Mercado Pago separately. Reconnect the same account
in the selected environment. The provider connection does not prove
current payment eligibility; dynamic Pix, automated token renewal and
webhook confirmation are later increments.

Deploy the backend migration/configuration first. No new frontend
environment variables or dependencies. Validate desktop/mobile OAuth
return, same-session enforcement, denied/expired/replayed authorization,
organization switching, reconnect and disconnect in a provider test
environment before enabling production.
