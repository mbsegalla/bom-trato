# Phase 4.1 — assisted receivable collection

The receivable detail screen now has a manual WhatsApp reminder section for open and partially paid receivables with a positive BRL balance. The action prepares a message only after reading the receivable again through the existing authenticated API and reading the current customer overview for the same organization. If the receivable changed, it refreshes the displayed balance and requires the operator to prepare again.

The message uses the remaining balance, not the original total, the receivable kind, the current customer name and due date. The preview shows the recipient and formatted telephone. Archived customers, invalid numbers, mismatched organization/customer IDs, canceled/paid receivables and zero balances cannot produce a link. There is no fallback to an arbitrary recipient. A changed receivable version resets the preview.

Only an explicit click opens WhatsApp with the encoded message. The operator reviews and sends it in WhatsApp. No message is sent from the server, no provider credentials or payment destination are included, and no receivable, payment, notification or billing record is written. A preview is a snapshot, not a real-time payment guarantee: refresh before sending when a payment may have arrived.

## Validation checklist

- Open a pending receivable and verify the name, phone, type, due date and exact remaining balance.
- Record a partial payment and prepare again; verify the amount decreases.
- Pay or cancel a receivable and verify the action disappears.
- Update the customer's phone, archive the customer or simulate a forbidden request; verify the next preparation uses the current record or blocks the link.
- Verify the URL contains the normalized Brazilian number and URL-encoded message, opens only after clicking, and never sends automatically.
- Change organization or receivable during loading and verify the old preview is not displayed.
- Verify no private notes, payment links, PIX keys or credentials are shared.

No backend changes, migration, dependencies or environment variables. Run the existing frontend `pnpm check` and `pnpm build` and exercise the checklist before merging. A payment provider, payment destination, confirmation webhook and automated customer messaging are separate increments.
