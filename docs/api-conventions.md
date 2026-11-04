# API conventions

## Responsibilities

- Laravel owns authentication, membership checks, permissions, tenant isolation, validation, and business calculations. A hidden button is not an authorization check.
- Next.js route handlers provide a same-origin bridge. They keep the Laravel token in an HttpOnly cookie, enforce the supported resource/method list, and translate transport failures into safe browser errors.
- Feature modules own their screens and forms. Use `src/lib/api.ts` for browser requests and `src/lib/types.ts` for shared API response types. Do not repeat fetch, cookie, or token logic inside features.

The App Router entry points stay thin. `src/app/api/backend/[...path]/route.ts` exports the handler from `src/lib/server/backend-proxy.ts`. Supporting modules separate endpoint/Origin policy (`proxy-policy.ts`), bounded body reads (`proxy-request.ts`), and cookies/safe responses (`proxy-response.ts`). These modules belong to the server and must not be imported into client features. Business permissions remain in Laravel.

## Frontend folder structure

```text
src/app/                         # Next.js route, page, layout, global styles
src/features/auth/components/    # Login and salon registration
src/features/platform/components/# SaaS administration
src/features/workspace/          # Session/data hooks and workspace orchestration
src/features/business/
  appointments/components/      # Appointment book and booking fields
  team/components/              # Staff directory and compensation fields
  payroll/components/           # Draft payroll and month fields
  access/components/            # Role/member management and focused editors
  catalog/components/           # Services/products pricing
  billing/components/           # Bill composer, cart lines, receipts
  billing/pos-catalog-picker.tsx # Searchable service/product POS picker
  workspace/components/         # Business shell, headings, details, shared form host
src/lib/                         # API client, response types, formatting
src/lib/server/                  # Server-side Laravel bridge
src/styles/pos.css               # POS-specific responsive styling
```

Use explicit feature imports through the `@/` alias. Keep field sections with the feature they describe, and keep cross-feature orchestration in `features/workspace`. `use-workspace.ts` handles session and navigation; `use-workspace-data.ts` refreshes permissions before loading business records, clears data during context changes, and rejects stale responses using a request generation. Business content is keyed by tenant and permissions so inline forms and bill receipts cannot survive a switch into another salon.

Run `npm run format` to apply Prettier, `npm run format:check` to verify formatting, and `npm run typecheck` to verify TypeScript. `npm run dev:lan` optionally listens on all network interfaces for testing from another device on the same network; the Laravel API can stay bound to loopback because requests pass through Next.js.

## Calling the API

Import `api` and `ApiError` from `@/lib/api`. Resource paths are relative strings without `/api/v1` or `/api/backend` prefixes. The helper accepts `GET` (default), `POST`, `PATCH`, and `DELETE`.

```ts
const dashboard = await api<Dashboard>("dashboard", { tenant: salon.slug });

await api<void>(`access/members/${member.id}`, {
  method: "DELETE",
  tenant: salon.slug,
});
```

GET requests have no body. Mutations send a JSON object; the helper sends `{}` when no fields are supplied. A successful `204 No Content` resolves as `undefined`, so use `api<void>` for deletes and logout. Pass an `AbortSignal` through `signal` to cancel a request when its screen unmounts or its selected salon changes.

The helper always sends same-origin credentials and disables caching. It never reads or writes bearer tokens. Do not store authentication tokens in local storage. Selecting a tenant only chooses request context; Laravel still checks membership and permissions on every request.

Business feature components use `useBranchApi()` inside `BranchApiProvider` so requests inherit the toolbar's branch selection. Explicit `branch` options override that selection. Workspace loaders send their branch explicitly. The bridge forwards `X-Branch`; Laravel validates branch membership and scopes both lists and identifier lookups. A conflicting `branch_id` query and header is rejected. Payroll is business-wide and requires all-branch access, regardless of toolbar selection.

## Resource groups

| Resource                                                                     | Methods       | Tenant header |
| ---------------------------------------------------------------------------- | ------------- | ------------- |
| `login`, `register`                                                          | POST          | No            |
| `me`                                                                         | GET           | No            |
| `logout`                                                                     | POST          | No            |
| `admin/dashboard`                                                            | GET           | No            |
| `admin/reports`, `admin/plans`, `admin/access`                               | GET           | No            |
| `admin/plans`, `admin/access/roles`                                          | POST          | No            |
| `admin/plans/{uuid}`, `admin/access/roles/{uuid}`, `admin/users/{uuid}/role` | PATCH         | No            |
| `admin/access/roles/{uuid}`                                                  | DELETE        | No            |
| `admin/tenants/{uuid}/subscription`                                          | GET, PATCH    | No            |
| `admin/tenants/{uuid}/subscription/trial`                                    | POST          | No            |
| `admin/tenants/{uuid}`                                                       | PATCH         | No            |
| `dashboard`                                                                  | GET           | Required      |
| `reports`, `subscription`, `deduction-options`                               | GET           | Required      |
| `deductions`, `branches`                                                     | GET, POST     | Required      |
| `deductions/{uuid}`                                                          | DELETE        | Required      |
| `branches/{uuid}`                                                            | PATCH, DELETE | Required      |
| `staff`                                                                      | GET, POST     | Required      |
| `staff/{uuid}`                                                               | PATCH         | Required      |
| `appointments`                                                               | GET, POST     | Required      |
| `appointment-options`                                                        | GET           | Required      |
| `appointments/{uuid}`                                                        | PATCH         | Required      |
| `payroll`                                                                    | GET, POST     | Required      |
| `catalog`                                                                    | GET, POST     | Required      |
| `catalog/{uuid}`                                                             | PATCH         | Required      |
| `orders`                                                                     | GET, POST     | Required      |
| `orders/{uuid}`                                                              | GET, PATCH    | Required      |
| `access`                                                                     | GET           | Required      |
| `access/roles`, `access/members`                                             | POST          | Required      |
| `access/roles/{uuid}`, `access/members/{uuid}`                               | PATCH, DELETE | Required      |

Platform administration checks `is_platform_admin` in Laravel. It does not imply membership in a salon or grant access to salon payroll. Tenant resources use `X-Tenant: <salon-slug>` and server-side membership permissions. Owner roles and owner memberships are protected from reassignment and removal. A role assigned to members cannot be deleted; the API returns `409 Conflict` until those assignments are changed.

Platform routes additionally check their named platform permission. The dashboard response includes metrics only with `platform.dashboard.view`, business records with `platform.tenants.view` or `platform.subscriptions.manage`, and account records with `platform.users.view`. Platform financial responses include currency-specific totals; legacy scalar totals represent LKR only. Business reports require `reports.view`; business access management requires all-branch access. Branch mutations require `branches.manage`; additional branch creation and existing branch mutations also require the subscription's `branches` module. DELETE deactivates a branch and preserves history.

Registration creates an owner and workspace without a placeholder branch. Each session tenant includes `needs_branch_setup`, computed from active branch records. While true, business endpoints return HTTP 409 with `code: "branch_setup_required"`. Session, logout, subscription recovery, and authorized branch endpoints remain available. `POST branches` creates the first branch as active and main; a multiple-branches entitlement is required only for additional locations. The frontend presents a required setup page before loading operational data and refreshes its session after creation. See [first-branch setup](branch-setup.md).

The booking options endpoint requires `appointments.manage` and returns active staff IDs, names, job titles, and active flags only. Booking users do not need `staff.view`, which explicitly includes compensation. Manage permissions require their corresponding view permissions; `orders.manage` also requires `catalog.view`. The role editor includes these dependencies automatically, and Laravel validates them independently. Users cannot edit their own role or change/remove their own membership.

## Data and errors

- IDs are UUID strings. The bridge accepts only the declared endpoint patterns and methods; add an endpoint to that policy when adding it in Laravel.
- Money uses integer minor units: `125050` represents `1,250.50` in a two-decimal currency. Commission rates use basis points: `1250` means `12.5%`. Follow each tenant's currency when displaying values.
- API datetime values include a timezone/offset. Use the salon timezone for display and calendar period boundaries. Date-only payroll boundaries use `YYYY-MM-DD`.
- Collection endpoints return `{ data: [...] }`. Session, dashboard, access, and platform dashboard endpoints use their exported response interfaces.
- Catalog entries distinguish `service` from `product` and store their current prices. Bill creation sends only catalog IDs and quantities; Laravel validates tenant ownership and active items, then calculates line totals and snapshots names, item types, and unit prices. Later catalog price changes must not rewrite existing bills.
- Orders use `status: "unpaid" | "paid"`. Manual payment records use `payment_method: "cash" | "card" | "other"`; recording a card method is a bookkeeping action and does not charge a card. Catalog permissions are `catalog.view`/`catalog.manage`, and billing permissions are `orders.view`/`orders.manage`.
- An order can be marked paid once; paid orders are immutable. Paid creation and payment updates require a payment method, while unpaid orders use `null`. Orders accept at most 100 distinct catalog items, each with an integer quantity from 1 to 1,000. Order detail and mutation responses use `{ data: Order }`.
- `ApiError.status` preserves HTTP status; `ApiError.errors` holds field messages. `ApiError.message` uses the first validation message when available. Network failures use status `0`.
- Treat `401` as an expired or missing session. Handle `403` as a permission denial, `409` as a state conflict, and `422` as invalid form input. Display a useful message and retain form values so the user can correct or retry.
- The bridge filters framework debug fields and returns a generic `502` when the Laravel server is unavailable or fails internally. Do not expose Laravel exception traces in UI messages.

## Server configuration

`LARAVEL_API_URL` is server-only and defaults to `http://127.0.0.1:8000/api/v1`. Never prefix it with `NEXT_PUBLIC_`. The bridge compares browser Origin to the actual Host header and request protocol, which also supports local LAN testing. It ignores forwarded-host headers. Set `APP_ORIGIN` to the exact public origin when a trusted deployment proxy changes the origin seen by Next.js.

State-changing requests require a matching Origin and `application/json`. The bridge caps request bodies at 64 KiB and upstream requests at 15 seconds. It never forwards browser Authorization headers, arbitrary cookies, or redirects. The session cookie is HttpOnly, SameSite=Lax, expires after eight hours, and uses Secure in production. Use HTTPS in production; this cookie policy alone does not complete deployment hardening.

## Changing an endpoint

Update Laravel validation and authorization first, then its tests, the shared response types, the bridge policy, and the consuming feature. Verify both allowed behavior and rejection for another salon or a user missing the permission. Do not cast an incompatible server payload into a new type to hide a contract mismatch.
