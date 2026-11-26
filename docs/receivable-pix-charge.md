# Phase 4.3 — static Pix payment instructions

The owner can open a pending receivable and select Gerar Pix. The authenticated API prepares a static BR Code for the remaining balance using the configured destination. The response is bound to the organization/receivable IDs and versions; a changed receivable prompts refresh rather than presenting a stale code. The preview is reset when the receivable version changes.

The frontend renders the QR matrix in a local SVG using qrcode-generator 2.0.4 (MIT, no runtime dependencies), byte mode, error correction M and a four-module quiet zone. No key or payload is sent to an external QR service. The copy-and-paste string can be selected or copied explicitly. A code is a snapshot, not revocable or automatically reconciled. The recipient shown is the configured label; verify the real recipient in the bank. No payment, automatic WhatsApp send or public payment link is created.

The backend from 4.3, phase 4.2 migration and receiving encryption key are required. No additional environment variable or migration. Install dependencies with pnpm install --frozen-lockfile; the pinned package and lock entry are included. Run pnpm check and pnpm build.

Acceptance: verify QR decoding equals the copy-and-paste text with an independent scanner; test all five key types, cents and partial balances, paid/canceled receivables, unset destinations, stale receivable version, organization switching, clipboard fallback and owner-only access. Do not submit a real payment in tests. The current runtime cannot install npm dependencies, so package installation, full build and browser/bank sandbox validation remain required.
