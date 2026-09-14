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
- `BACKEND_URL` — order/consultation backend (NestJS + PostgreSQL, separate repo). **Private**
  (no `NEXT_PUBLIC_` prefix) — the browser never calls it directly, only Server Actions do.
- `NEXT_PUBLIC_BACKEND_CMS_URL` — CMS backend (articles/testimonials, auth via cookies)
- `NEXT_PUBLIC_PROYECTO_ID` — project id sent to the CMS backend
- `COGNITO_ISSUER_URL`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`, `COGNITO_REDIRECT_URI`,
  `COGNITO_DOMAIN` — Amazon Cognito (Hosted UI, native login + Google as a federated Identity
  Provider). `SESSION_SECRET` — signs the app's own `session` cookie. See `doc/auth.md`.

Path alias: `@/*` → `./src/*` (see `tsconfig.json`).

## Authentication (Amazon Cognito)

Implemented — see `doc/auth.md` (frontend pieces: Hosted UI, session cookie, token refresh, Server
Actions) and `doc/flow.md` (full end-to-end flow across both repos + DB, including why identity
and profile-completion are two separate steps). Backend side documented in
`nutricionista-virtual-back/doc/auth.md`. Key point for this repo: the browser **never** calls
`BACKEND_URL` directly — every call goes through a Server Action
(`src/features/consultation/services/consultation.actions.ts`,
`src/shared/auth/profile.actions.ts`) that attaches the Cognito Access Token, refreshing it
silently via `src/shared/auth/tokens.ts` when it's expired.

## Architecture

Next.js 15 App Router + React 19 + TypeScript, Tailwind CSS 4. Code is organized `src/app` (routes only) / `src/features/<feature>` (components, dtos, entities, services per feature) / `src/shared` (cross-feature components, context, api clients). Each of `src/features` and `src/shared` has a barrel `index.ts` that re-exports everything; other code imports from `@/features` / `@/shared` rather than deep paths.

**Barrel gotcha (found while making `Hero`/`NavbarLanding` session-aware, see `doc/auth-pending.md`)**:
`src/features/index.ts` re-exports both plain components and Client Components (`'use client'`,
e.g. `testimonial-form.component.tsx`). That pulls the **whole barrel** into the browser bundle —
any component re-exported there that imports `server-only` code (e.g. anything from
`src/shared/auth/session.ts`) breaks the build, even if in practice it only ever renders
server-side. Workaround used so far: compute the server-only value in the actual Server Component
ancestor (a page or `layout.tsx` that doesn't go through the barrel) and pass it down as a prop,
instead of importing server-only code inside a component that's re-exported from `@/features`.

### Two separate backends, two separate API clients

This app talks to **two unrelated backends**, each with its own fetch wrapper — don't mix them up:

- **Order/consultation backend** (`src/shared/api/client.ts`, `apiFetch`) — `server-only`, hits the private `BACKEND_URL`. Only ever called from Server Actions (`consultation.actions.ts`, `profile.actions.ts`), which attach `Authorization: Bearer <access_token>` for the endpoints that require a session (order creation, chat, order status polling — see `doc/auth.md`). `ConsultationService` (`src/features/consultation/services/consultation.service.ts`) is the public-facing wrapper Client Components actually call — same shape as before this became auth-aware, so call sites didn't change.
- **CMS backend** (`src/shared/api/client-cms.ts`, `apiFetchCMS` / `apiFetchFormData`) — used by `ArticlesServicePublic` and the testimonials service. In the browser it always goes through the `/api/*` → CMS rewrite in `next.config.ts` (never calls the CMS origin directly), carries cookies (`credentials: 'include'`), fetches a CSRF token for mutating requests, and auto-retries once on 401 via `/auth/refresh`. On the server it calls `NEXT_PUBLIC_BACKEND_CMS_URL` directly.

The Content-Security-Policy is nonce-based and generated per-request in `src/proxy.ts` (Next.js 16's replacement for the `middleware.ts` file convention), since the nonce must change on every response. `next.config.ts` keeps only the static security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Strict-Transport-Security` in prod) and the `images.remotePatterns` allowlist (local uploads + the S3 bucket the CMS serves images from) — extend that allowlist, and the `img-src`/`connect-src` directives in `src/proxy.ts`, rather than loosening CSP if a new image host or backend origin is needed. See `doc/security.md` for details.

### Paid consultation flow (the core product)

Requires an authenticated Cognito session from `/consulta/inicio` onward (`src/proxy.ts` gates
`/consulta/*` except `/consulta`, unused/empty; login lives at `/login`, outside `/consulta/*`, so
it doesn't need special-casing there; the backend separately gates order creation and chat — see
`doc/auth.md`). The "Iniciar Consulta" buttons on the home page (navbar, hero) already check session
before routing (`getStartConsultationHref()`) — no session goes straight to `/login`, skipping
`/consulta/inicio` entirely; without that, direct navigation/a bookmark hits the same proxy gate and
gets redirected to `/login` anyway. With a session, `/consulta/inicio`'s own "Iniciar" button routes
to one of three places depending on session + profile-completion state: `/login` (session became
invalid in between — the proxy already re-checks this on every request, so this branch inside the
page is defense-in-depth, not the primary gate), `/consulta/informacion-personal` (incomplete
profile — RUT/name/gender/DOB aren't in Cognito, the user fills them once), or straight to `/home`
(profile already complete — `/home` is a bare placeholder page, gated by `src/proxy.ts` just like
`/consulta/*`: no session redirects to `/login`).

Routes: `/consulta/inicio` → `/consulta/informacion-personal` (skipped if the profile is already
complete, in which case `/consulta/inicio` sends the user to `/home` instead) → `/consulta/anamnesis`
→ `/consulta/evaluacion-fisica` → `/consulta/generar-orden` → `/pago/[orderId]` → `/ordenes/[id]`.

State lives in `ConsultationProvider` / `useConsultation` (`src/shared/context/consultation.context.tsx`), persisted to `localStorage` under `consulta_context` on every mutation (so it survives a refresh, except in-progress, unconfirmed anamnesis chat). It holds four independent pieces — `personalInfo`, `anamnesis`, `measurements`, `nutritionPlan` — each with its own setter and reset. `getCompleteConsultation()` assembles the full DTO from the first three, returning `null` if any is missing. Note: `nutritionPlan` in this context is effectively unused by the live flow — the actual plan is read via polling in `/ordenes/[id]` (`plan_json` from `OrderStatusDto`), not from context.

Key steps:
- **Anamnesis** (`ChatAnamnesis`): each user turn calls `ConsultationService.sendAnamnesisTurn`, sending the full message history + current `AnamnesisDto` to the backend, which returns the next question plus an updated `AnamnesisDto` and an `isComplete` flag. Anamnesis state is local to the component until the user confirms with "Siguiente" — reloading mid-chat loses progress.
- **Generate order**: builds a `CompleteConsultationDto` from context and calls `ConsultationService.createOrder`, creating an `orden` row backend-side with `estado_pago: 'pendiente'`. Requires a session with a **complete** profile — the backend resolves the `user` from the token and 400s if the profile isn't complete (shouldn't happen in practice, since the frontend already gates on this earlier, but it's enforced server-side too). The AI plan is **not** generated yet — that's deferred until payment confirms, to avoid spending compute on abandoned checkouts.
- **Payment** (`/pago/[orderId]`): a simulated gateway (card fields are decorative/disabled). "Pagar" calls `ConsultationService.simulatePayment`, which triggers backend-side the same logic a real payment webhook would. This page is a stand-in for a future real-gateway checkout + webhook.
- **Order status** (`/ordenes/[id]`): polls `ConsultationService.getOrderStatus` every 4s, reading `estado_pago` / `estado_generacion` / `plan_json`. Shows a delay notice past 45s while generating, renders the PDF download (`DownloadPlanPdf`, dynamically imported since `@react-pdf/renderer` only runs client-side) once `completado`, or a reassuring error state — the polling URL is meant to be revisited later.

Backend data model (separate repo, NestJS + PostgreSQL): a single `orden` entity holding the submitted consultation data, `estado_pago` (`pendiente|pagado`), `estado_generacion` (`no_iniciado|generando|completado|error`), and `plan_json`.

### CMS-backed content (articles, testimonials, home)

`ArticlesServicePublic` and the testimonials service follow a DTO (wire shape from CMS) → entity (typed domain shape used by components) split, unlike the consultation feature which uses DTOs directly. These pages read/write through the CMS backend via `apiFetchCMS`, independent of the consultation flow's backend.

### Known inconsistency: README vs. code naming

Routes were renamed from English to Spanish (`/consultation/...` → `/consulta/...`, `/orders/[id]` → `/ordenes/[id]`, `/payment/[orderId]` → `/pago/[orderId]`, `/articles` → `/articulos`, `/cart` → `/carrito`, `/plans` → `/planes`, `/testimonials` → `/testimonios`, etc.) so the routes now **match** `README.md`, which already documented Spanish route names from before an earlier English naming-convention refactor. What's still inconsistent between docs/README and code is naming *below* the route level: internal DTOs/services/functions keep the project's English convention (`PersonalInfoDto`, `ConsultationService` in `src/features/consultation`, ...) — only `src/app` folder names and the URLs they produce changed, `src/features/*` and `src/shared/*` did not. The backend (separate repo) exposes its own Spanish endpoint paths (`consulta/chat`, `ordenes/crear`, `ordenes/obtener-estado/:id`), unrelated to and unchanged by this frontend route rename. When in doubt, trust the code over any doc's naming for internal DTOs/functions — but for navigable routes, code and README now agree.

## Documentation maintenance

After making a **large or structurally significant** change — a new route/page, a new feature directory, a change to the consultation/payment/order flow, a new or changed backend integration/API contract, or a project-wide naming/convention change — invoke the `doc-writer` subagent (via the Agent tool) to update `README.md` and/or `doc/` accordingly. Small or purely internal changes (refactors with no behavior/contract change, styling, bugfixes) don't need it. This is not wired to a hook — you (Claude) are responsible for deciding when a change qualifies and triggering it yourself.

## Test maintenance

The project has unit tests (Vitest + React Testing Library, see `vitest.config.ts`) and e2e tests (Playwright, see `playwright.config.ts`), documented in `doc/testing.md`. After changing code covered by an existing test — or adding a component/service/page in an already-covered area (consultation feature, `shared/api`, `shared/context`, `nutrition-plan`) — invoke the `test-maintainer` subagent (via the Agent tool) to update or extend the relevant tests. Not wired to a hook — you (Claude) decide when it applies and trigger it yourself.

## Known technical debt (from README)

- ~~The order/consultation backend URL is exposed as a public env var...~~ — **resolved**: `BACKEND_URL` is private, every call goes through a Server Action carrying the Cognito Access Token. See `doc/auth.md`.
- Anamnesis state is only persisted to context/localStorage once the chat completes; a mid-chat reload re-runs (and re-bills, token-wise) the whole conversation. Intended fix: persist incrementally per turn, plus add an explicit reset action for users who want to restart.
- Auth-related gaps still open: `GET /ordenes/obtener-estado/:id` doesn't verify the order belongs to the token's user (BOLA); the "athlete" question in `informacion-personal` isn't persisted per-user, so returning users who skip that form never get asked again. See `doc/auth-pending.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
