# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js dev server (turbopack) on :3000
npm run build    # production build
npm run start    # serve production build on :3000
npm run lint     # next lint
```

There is no test suite configured (no test script, no test runner in `package.json`).

## Environment

Requires a `.env` (see `.env.template`) with:
- `NEXT_PUBLIC_BACKEND_URL` — order/consultation backend (NestJS + SQLite, separate repo)
- `NEXT_PUBLIC_BACKEND_CMS_URL` — CMS backend (articles/testimonials, auth via cookies)
- `NEXT_PUBLIC_PROYECTO_ID` — project id sent to the CMS backend

Path alias: `@/*` → `./src/*` (see `tsconfig.json`).

## Architecture

Next.js 15 App Router + React 19 + TypeScript, Tailwind CSS 4. Code is organized `src/app` (routes only) / `src/features/<feature>` (components, dtos, entities, services per feature) / `src/shared` (cross-feature components, context, api clients). Each of `src/features` and `src/shared` has a barrel `index.ts` that re-exports everything; other code imports from `@/features` / `@/shared` rather than deep paths.

### Two separate backends, two separate API clients

This app talks to **two unrelated backends**, each with its own fetch wrapper — don't mix them up:

- **Order/consultation backend** (`src/shared/api/client.ts`, `apiFetch`) — hits `NEXT_PUBLIC_BACKEND_URL` directly from the browser, no auth/credentials. Used by `ConsultationService` (`src/features/consultation/services/consultation.service.ts`) for the paid nutrition-plan flow (chat, order creation, payment simulation, order status polling).
- **CMS backend** (`src/shared/api/client-cms.ts`, `apiFetchCMS` / `apiFetchFormData`) — used by `ArticlesServicePublic` and the testimonials service. In the browser it always goes through the `/api/*` → CMS rewrite in `next.config.ts` (never calls the CMS origin directly), carries cookies (`credentials: 'include'`), fetches a CSRF token for mutating requests, and auto-retries once on 401 via `/auth/refresh`. On the server it calls `NEXT_PUBLIC_BACKEND_CMS_URL` directly.

`next.config.ts` also sets CSP/security headers (stricter in production) and an `images.remotePatterns` allowlist (local uploads + the S3 bucket the CMS serves images from) — extend that allowlist rather than loosening CSP if a new image host is needed.

### Paid consultation flow (the core product)

Routes: `/consultation/personal-info` → `/consultation/anamnesis` → `/consultation/physical-assessment` → `/consultation/generate-order` → `/payment/[orderId]` → `/orders/[id]`.

State lives in `ConsultationProvider` / `useConsultation` (`src/shared/context/consultation.context.tsx`), persisted to `localStorage` under `consulta_context` on every mutation (so it survives a refresh, except in-progress, unconfirmed anamnesis chat). It holds four independent pieces — `personalInfo`, `anamnesis`, `measurements`, `nutritionPlan` — each with its own setter and reset. `getCompleteConsultation()` assembles the full DTO from the first three, returning `null` if any is missing. Note: `nutritionPlan` in this context is effectively unused by the live flow — the actual plan is read via polling in `/orders/[id]` (`plan_json` from `OrderStatusDto`), not from context.

Key steps:
- **Anamnesis** (`ChatAnamnesis`): each user turn calls `ConsultationService.sendAnamnesisTurn`, sending the full message history + current `AnamnesisDto` to the backend, which returns the next question plus an updated `AnamnesisDto` and an `isComplete` flag. Anamnesis state is local to the component until the user confirms with "Siguiente" — reloading mid-chat loses progress.
- **Generate order**: builds a `CompleteConsultationDto` from context and calls `ConsultationService.createOrder`, creating an `orden` row backend-side with `estado_pago: 'pendiente'`. The AI plan is **not** generated yet — that's deferred until payment confirms, to avoid spending compute on abandoned checkouts.
- **Payment** (`/payment/[orderId]`): a simulated gateway (card fields are decorative/disabled). "Pagar" calls `ConsultationService.simulatePayment`, which triggers backend-side the same logic a real payment webhook would. This page is a stand-in for a future real-gateway checkout + webhook.
- **Order status** (`/orders/[id]`): polls `ConsultationService.getOrderStatus` every 4s, reading `estado_pago` / `estado_generacion` / `plan_json`. Shows a delay notice past 45s while generating, renders the PDF download (`DownloadPlanPdf`, dynamically imported since `@react-pdf/renderer` only runs client-side) once `completado`, or a reassuring error state — the polling URL is meant to be revisited later.

Backend data model (separate repo, NestJS + SQLite): a single `orden` entity holding the submitted consultation data, `estado_pago` (`pendiente|pagado`), `estado_generacion` (`no_iniciado|generando|completado|error`), and `plan_json`.

### CMS-backed content (articles, testimonials, home)

`ArticlesServicePublic` and the testimonials service follow a DTO (wire shape from CMS) → entity (typed domain shape used by components) split, unlike the consultation feature which uses DTOs directly. These pages read/write through the CMS backend via `apiFetchCMS`, independent of the consultation flow's backend.

### Known inconsistency: README vs. code naming

`README.md` documents the consultation flow using older Spanish route/DTO names (`/consulta/...`, `informacion_personal`, etc.) from before a naming-convention refactor. Current code under `src/app` and `src/features/consultation` uses English names (`/consultation/...`, `PersonalInfoDto`, `ConsultationService`, ...), while the backend API paths themselves are still Spanish (`consulta/chat`, `ordenes/crear`, `ordenes/obtener-estado/:id`) since the backend lives in a separate repo. When in doubt, trust the code over the README's naming.

## Documentation maintenance

After making a **large or structurally significant** change — a new route/page, a new feature directory, a change to the consultation/payment/order flow, a new or changed backend integration/API contract, or a project-wide naming/convention change — invoke the `doc-writer` subagent (via the Agent tool) to update `README.md` and/or `doc/` accordingly. Small or purely internal changes (refactors with no behavior/contract change, styling, bugfixes) don't need it. This is not wired to a hook — you (Claude) are responsible for deciding when a change qualifies and triggering it yourself.

## Known technical debt (from README)

- The order/consultation backend URL is exposed as a public env var (`NEXT_PUBLIC_BACKEND_URL`) and fetched directly from the browser with no auth — unlike the CMS client, it has no cookie/CSRF handling. Intended fix: make it private and proxy it like the CMS backend does.
- Anamnesis state is only persisted to context/localStorage once the chat completes; a mid-chat reload re-runs (and re-bills, token-wise) the whole conversation. Intended fix: persist incrementally per turn, plus add an explicit reset action for users who want to restart.
