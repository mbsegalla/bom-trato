# Sandbox Pix reconciliation and review

Phase 4.5.5 adds an owner-only review panel to receivable details. It
appears when an existing test issuance is visible. The panel shows the
latest manual check and latest verified matched webhook separately from
the local issuance status. An authorized owner can query the existing
payment through the API without providing a provider payment ID or buyer
data. The API decides eligibility, rate limits, scope and binding.

A missing or ambiguous result does not unlock a replacement Pix.
A verified sandbox approval is not a real receivable payment.
After a check the UI reloads the issuance and its review, so the server
can withhold an invalidated QR. No refunds, cancellation, reissue, customer
sharing or live payment actions are added.

Deploy the API recovery migration and endpoints first. No frontend
dependencies or environment variables. Validate browser behavior,
authorization, stale state, provider failures, concurrent attempts,
and actual sandbox recovery before use.
