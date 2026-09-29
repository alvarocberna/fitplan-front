# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js dev server (turbopack) on :3000
npm run build    # production build
npm run start    # serve production build on :3000
npm run lint     # next lint (no ESLint config in the repo yet — it doesn't run)
npm run test     # unit tests (Vitest + React Testing Library), once
npm run test:e2e # e2e (Playwright): starts a fake backend on :3101 + `next dev` on :3100 by itself
```

Test setup and what's covered: `doc/testing.md`. E2E reads its own env from `.env.test` (committed, dummy
values): `BACKEND_URL` points at the fake backend, `SESSION_SECRET` signs the session cookie the tests fabricate.

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

- **Order/consultation backend** (`src/shared/api/client.ts`, `apiFetch`) — `server-only`, hits the private `BACKEND_URL` and prepends the backend's `api/v1` prefix (`API_PREFIX`) to every endpoint (routes: `me`, `consultations`, `orders/:id/status`, `plans/standard/...`, `dev/orders/:id/simulate-payment`; see the backend README). Only ever called from Server Actions (`consultation.actions.ts`, `profile.actions.ts`), which attach `Authorization: Bearer <access_token>` for the endpoints that require a session (order creation, chat, order status polling — see `doc/auth.md`). `ConsultationService` (`src/features/consultation/services/consultation.service.ts`) is the public-facing wrapper Client Components actually call — same shape as before this became auth-aware, so call sites didn't change.
- **CMS backend** (`src/shared/api/client-cms.ts`, `apiFetchCMS` / `apiFetchFormData`) — used by `ArticlesServicePublic` and the testimonials service. In the browser it always goes through the `/api/*` → CMS rewrite in `next.config.ts` (never calls the CMS origin directly), carries cookies (`credentials: 'include'`), fetches a CSRF token for mutating requests, and auto-retries once on 401 via `/auth/refresh`. On the server it calls `NEXT_PUBLIC_BACKEND_CMS_URL` directly.

The Content-Security-Policy is nonce-based and generated per-request in `src/proxy.ts` (Next.js 16's replacement for the `middleware.ts` file convention), since the nonce must change on every response. `next.config.ts` keeps only the static security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Strict-Transport-Security` in prod) and the `images.remotePatterns` allowlist (local uploads + the S3 bucket the CMS serves images from) — extend that allowlist, and the `img-src`/`connect-src` directives in `src/proxy.ts`, rather than loosening CSP if a new image host or backend origin is needed. See `doc/security.md` for details.

### Session area: `(sesion)` route group and route gating

Every route that needs a logged-in user lives under the route group `src/app/(sesion)/` (no URL
segment): `/inicio`, `/planes`, `/mediciones`, `/perfil`, `/consulta/*`, `/pago/[orderId]` and `/ordenes/[id]`. They share
`src/app/(sesion)/layout.tsx`, which renders `SesionShell` (`src/shared/components/sesion-shell.component.tsx`,
a Client Component): `TopbarSesion` + the `NavbarSesion` sidebar + a `<main>` (`pt-19 md:pt-23`) whose
left padding follows the sidebar width. `TopbarSesion` is a fixed 60px (`h-15`) full-width bar: the
"Nuvi" text logo (→ `/inicio`) on the left and the "Nueva consulta" button (→ `/consulta/anamnesis`) on the
right. The sidebar (md+ only, below the top bar; options Inicio = `/inicio`, Planes = `/planes`, Mediciones = `/mediciones`, Perfil, Cerrar sesión) starts
**docked** (narrow, `w-14`, no links) in the flow routes `/consulta/*`, `/pago/*`,
`/ordenes/*`, and **undocked** (`w-56`, with links) in `/inicio`, `/planes`, `/mediciones` and `/perfil`; the manual choice is kept
while navigating inside the same section and discarded when switching between sections. It is toggled
by a 16×32px arrow button centered on the sidebar's right border (hover lights up its border and the
sidebar's right border with `--color-primary`) or by clicking anywhere on the sidebar except the nav links. On small
screens there is no sidebar: `TopbarSesion` also hosts those options (`compact` variant). Both
share `SESION_NAV_ITEMS` / `SesionNavLink` (`sesion-nav-link.component.tsx`). These routes do
**not** show `NavbarLanding` — `NavbarLandingGate` (root layout) hides it via `usesSesionLayout()`.
Because `<main>` already provides `min-h-screen` and padding, pages inside the group must not add their
own `min-h-screen` / large top padding (they use `py-4`). Pages of the user sections (`/inicio`, `/planes`, `/mediciones`,
`/perfil` and their subroutes, including `not-found`) wrap their content in `w-[90%] mx-auto` (no `max-w-*`).

Gating is by `src/proxy.ts`, which redirects to `/login` without a valid session cookie:
`/consulta/*` (except the bare `/consulta`, empty and intentionally public), `/pago/*`, `/ordenes/*`
(via `isSessionGatedPrefix`), and `/inicio`, `/planes`, `/mediciones`, `/perfil` and their subroutes, e.g. the consultation detail
`/inicio/consultas/[id]` (via `isSesionRoute`, prefix match). Route lists live in
`src/shared/auth/sesion-routes.ts` — when adding a route to the session area, update that file **and**
put the page under `(sesion)`; `isSesionRoute` (proxy) is deliberately separate from
`isFocusRoute` / `usesSesionLayout` (presentation only).

`apiFetch` throws `ApiError` (with the HTTP `status`) and `runAction` forwards that `status` in the failed
`ActionResult`, so a service can tell a 404 apart (e.g. `DashboardService.getConsultation` returns `null` →
the page calls `notFound()`).

### Paid consultation flow (the core product)

Requires an authenticated Cognito session from `/consulta/inicio` onward (`src/proxy.ts` gates
`/consulta/*` except `/consulta`, and also `/pago/*` and `/ordenes/*` — see the section above; login
lives at `/login`, outside those prefixes, so it doesn't need special-casing there; the backend
separately gates order creation and chat — see `doc/auth.md`). The "Iniciar Consulta" buttons on the home page (navbar, hero) already check session
before routing (`getStartConsultationHref()`) — no session goes straight to `/login`, skipping
`/consulta/inicio` entirely; without that, direct navigation/a bookmark hits the same proxy gate and
gets redirected to `/login` anyway. With a session, `/consulta/inicio`'s own "Iniciar" button routes
to one of three places depending on session + profile-completion state: `/login` (session became
invalid in between — the proxy already re-checks this on every request, so this branch inside the
page is defense-in-depth, not the primary gate), `/consulta/informacion-personal` (incomplete
profile — RUT/name/gender/DOB aren't in Cognito, the user fills them once), or straight to `/inicio`
(profile already complete — `/inicio` lives under `src/app/(sesion)/inicio`, gated by `src/proxy.ts`
just like the rest of the flow: no session redirects to `/login`).

Routes: `/consulta/inicio` → `/consulta/informacion-personal` (skipped if the profile is already
complete, in which case `/consulta/inicio` sends the user to `/inicio` instead) → `/consulta/anamnesis`
→ `/consulta/evaluacion-fisica` → `/consulta/generar-orden` → `/pago/[orderId]` → `/ordenes/[id]`.

State lives in `ConsultationProvider` / `useConsultation` (`src/shared/context/consultation.context.tsx`), persisted to `localStorage` under `consulta_context` on every mutation (so it survives a refresh, except in-progress, unconfirmed anamnesis chat). It holds four independent pieces — `personalInfo`, `anamnesis`, `measurements`, `nutritionPlan` — each with its own setter and reset. `getCompleteConsultation()` assembles the full DTO from the first three, returning `null` if any is missing. Note: `nutritionPlan` in this context is effectively unused by the live flow — the actual plan is read via polling in `/ordenes/[id]` (`plan_json` from `OrderStatusDto`), not from context.

Key steps:
- **Anamnesis** (`ChatAnamnesis`): each user turn calls `ConsultationService.sendAnamnesisTurn`, sending the full message history + current `AnamnesisDto` to the backend, which returns the next question plus an updated `AnamnesisDto` and an `isComplete` flag. Anamnesis state is local to the component until the user confirms with "Siguiente" — reloading mid-chat loses progress.
- **Physical assessment** (`FormMeasurements`): on submit it saves `measurements` and calls `ConsultationService.evaluateGoalFeasibility` (`POST consultations/goal-feasibility`, CU-CON-03). If the goal is not feasible (e.g. losing weight with BMI ≤ 20) the form is replaced by `GoalNotFeasible`: the backend's message plus "Salir" (→ `/inicio`) and "Nueva consulta" (→ `/consulta/anamnesis`), both discarding `anamnesis` and `measurements` from the context (`personalInfo` is kept). Otherwise it goes on to `/consulta/generar-orden`. The context setters/resets update `stateRef` synchronously (`persist`), so two mutations in the same event don't overwrite each other in `localStorage`.
- **Generate order**: builds a `CompleteConsultationDto` from context and calls `ConsultationService.createOrder`, creating an `orden` row backend-side with `estado_pago: 'PENDING'`. Requires a session with a **complete** profile — the backend resolves the `user` from the token and 400s if the profile isn't complete (shouldn't happen in practice, since the frontend already gates on this earlier, but it's enforced server-side too). The AI plan is **not** generated yet — that's deferred until payment confirms, to avoid spending compute on abandoned checkouts.
- **Payment** (`/pago/[orderId]`): a simulated gateway (card fields are decorative/disabled). "Pagar" calls `ConsultationService.simulatePayment`, which triggers backend-side the same logic a real payment webhook would. This page is a stand-in for a future real-gateway checkout + webhook.
- **Order status** (`/ordenes/[id]`): polls `ConsultationService.getOrderStatus` every 4s, reading `estado_pago` / `estado_generacion` / `plan_json`. Shows a delay notice past 45s while generating, renders a thumbnail of the plan's first page plus a "Descargar plan" button for the full PDF and an "Ir a inicio" button (→ `/inicio`) (`PlanFileCard`, `src/shared/components/`, the same PDF card as the plan detail `/planes/[orderId]`; it shows "Ir a inicio" only on `/ordenes/*`, via `usePathname`; the backend generates the PDF and thumbnail and returns signed `pdfUrl`/`thumbnailUrl`) once `COMPLETED`, or a reassuring error state — the polling URL is meant to be revisited later.

Backend data model (separate repo, NestJS + PostgreSQL): a single `orden` entity holding the submitted consultation data, `estado_pago` (`PENDING|PAID`), `estado_generacion` (`no_iniciado|generando|completado|error`), and `plan_json`.

### Predefined plans (selection → cart → payment → /inicio)

Second way to buy, next to the paid consultation: 4 ready-made plans (`PLANS` in `src/shared/data/data.ts`:
`plan-gimnasio-volumen`, `plan-gimnasio-definicion`, `plan-running`, `plan-deporte-cancha`), each in 28 hidden
versions (7 weight ranges × 2 sexes × 2 age groups). The user never sees the versions: they fill weight, height, sex and
age and the system picks theirs. Public routes: `/` (carousel), `/planes-estandar`, `/planes-estandar/[slug]`, `/carrito`. Full flow, tables and
S3 naming: `../doc/flows/purchase-flow-predefined-plan.md`.

- **Selection**: "Seleccionar" (carousel + `/planes-estandar`) opens `PlanSelectionModal` ("Completa tu información para obtener el plan
  más adecuado"; mounted once in the root `layout.tsx`, rendered through a portal by `Modal` because the GSAP carousel's
  `transform` would break a `position: fixed` inside it). "Confirmar" goes to `/planes-estandar/<slug>`, which shows the same 4 fields
  (`PlanSelectionFields`), the version's thumbnail and price, and "Añadir al carro".
- **State**: `PlanSelectionProvider` / `usePlanSelection` (`src/shared/context/plan-selection.context.tsx`, root layout,
  persisted in `localStorage` under `plan_selection`): `selection` (weight range, height, sex, age range), `cartItem`
  (`{ planSlug, code }` — **one plan per purchase**, adding replaces) and the modal state. Height is captured but does not
  affect which version is chosen.
- **Version code**: `buildPlanCode(slug, selection)` (`src/shared/data/plan-code.ts`) → `<plan>-<minKg>-<maxKg>-<m|f>-<joven|adulto>`,
  e.g. `plan-gimnasio-volumen-50-60-m-joven`; only 18-30 is `joven`. It must match the backend's `Product.code`. The backend does not trust
  it: price and files always come from its database (`GET /plans/standard/:code`, public, via `PlansService`).
- **Cart / payment**: `/carrito` is a Server Component that reads `getSession()` (the cookie is httpOnly) and passes
  `isAuthenticated` to `CartView`. "Pagar" without a session opens `LoginModal` (same options as `/login`, shared `LoginOptions`,
  `return_to=/carrito`); with a session it calls `POST /plans/standard/:code/purchase` and goes to `/pago/<id>?tipo=predefinido`, which
  after the simulated payment clears the cart and goes to `/inicio` (without `?tipo`, the consultation flow keeps going to
  `/ordenes/[id]`). `/pago/*` and `/inicio` need a session (`src/proxy.ts`); the cart and the plan pages don't.
- **Login with return**: `/api/cognito/login?return_to=/carrito` stores the destination in a short-lived httpOnly cookie
  (`post_login_return_to`); `/api/cognito/callback` consumes it. Only routes in the allowlist of `src/shared/auth/return-to.ts`
  are accepted (no open redirect). The callback still runs the profile sync, which creates the identity the backend needs.
- Code: `src/features/plans/` (components, `hooks/use-predefined-product.ts`, `services/plans.{actions,service}.ts`).
  `ActionResult` gained an optional `code: 'unauthenticated'` so the UI can tell "no session" from a generic error
  (`SessionRequiredError`).

### CMS-backed content (articles, testimonials, home)

`ArticlesServicePublic` and the testimonials service follow a DTO (wire shape from CMS) → entity (typed domain shape used by components) split, unlike the consultation feature which uses DTOs directly. These pages read/write through the CMS backend via `apiFetchCMS`, independent of the consultation flow's backend.

### Known inconsistency: README vs. code naming

Routes were renamed from English to Spanish (`/consultation/...` → `/consulta/...`, `/orders/[id]` → `/ordenes/[id]`, `/payment/[orderId]` → `/pago/[orderId]`, `/articles` → `/articulos`, `/cart` → `/carrito`, `/plans` → `/planes` (later `/planes-estandar`, to free `/planes` for the session page "Mis planes"), `/testimonials` → `/testimonios`, `/panel` → `/inicio` — with permanent redirects `/panel` and `/panel/*` → `/inicio` in `next.config.ts` `redirects()`; the feature folder became `src/features/dashboard` (`DashboardService`, …), etc.) so the routes now **match** `README.md`, which already documented Spanish route names from before an earlier English naming-convention refactor. What's still inconsistent between docs/README and code is naming *below* the route level: internal DTOs/services/functions keep the project's English convention (`PersonalInfoDto`, `ConsultationService` in `src/features/consultation`, ...) — only `src/app` folder names and the URLs they produce changed, `src/features/*` and `src/shared/*` did not. The backend (separate repo) exposes its own Spanish endpoint paths (`/consultations/chat`, `/consultations`, `/orders/:id/status`), unrelated to and unchanged by this frontend route rename. When in doubt, trust the code over any doc's naming for internal DTOs/functions — but for navigable routes, code and README now agree.

## Documentation maintenance

After making a **large or structurally significant** change — a new route/page, a new feature directory, a change to the consultation/payment/order flow, a new or changed backend integration/API contract, or a project-wide naming/convention change — invoke the `doc-writer` subagent (via the Agent tool) to update `README.md` and/or `doc/` accordingly. Small or purely internal changes (refactors with no behavior/contract change, styling, bugfixes) don't need it. This is not wired to a hook — you (Claude) are responsible for deciding when a change qualifies and triggering it yourself.

## Test maintenance

The project has unit tests (Vitest + React Testing Library, see `vitest.config.ts`) and e2e tests (Playwright, see `playwright.config.ts`), documented in `doc/testing.md`. After changing code covered by an existing test — or adding a component/service/page in an already-covered area (consultation feature, `shared/api`, `shared/context`, `nutrition-plan`, session routing/layout) — invoke the `test-maintainer` subagent (via the Agent tool) to update or extend the relevant tests. Not wired to a hook — you (Claude) decide when it applies and trigger it yourself.

E2E gotchas (details in `doc/testing.md`): the backend is called from Server Actions (Node), so `page.route` can't mock it — specs configure the fake backend `e2e/fake-backend/server.mjs` through `e2e/helpers/mock-backend.ts`, and import `test`/`expect` from `e2e/fixtures.ts`, which resets that backend and installs a signed `session` cookie before each test (`test.use({ authenticated: false })` to opt out). Any new backend endpoint a page/action hits needs a handler in the fake backend (unmocked ones answer `501` on purpose). The suite runs serially because the fake backend's state is global.

## Known technical debt (from README)

- ~~The order/consultation backend URL is exposed as a public env var...~~ — **resolved**: `BACKEND_URL` is private, every call goes through a Server Action carrying the Cognito Access Token. See `doc/auth.md`.
- Anamnesis state is only persisted to context/localStorage once the chat completes; a mid-chat reload re-runs (and re-bills, token-wise) the whole conversation. Intended fix: persist incrementally per turn, plus add an explicit reset action for users who want to restart.
- `athlete` ("Deportista" in `informacion-personal`) is persisted on the backend `User` via `PATCH /me` (`updateProfileAction`) and prefilled from `PerfilStatus.athlete`. The select has three levels (`none` / `recreational` / `professional`, form-only field `sportLevel`); only `professional` maps to `athlete = true`. Since only the boolean is stored, a previous "recreational" answer is prefilled as `none`. (The BOLA on `GET /orders/:id/status` is recorded as **resolved** in the backend repo — see `doc/flow.md`; not re-verified from this repo.)
- E2E doesn't cover the real Cognito login (the session cookie is fabricated). The fake backend (`e2e/fake-backend/server.mjs`) mirrors the backend's `/api/v1` routes and rejects calls without the prefix; `/perfil` has no e2e spec yet.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
