# Salon management SaaS architecture

This project is a Laravel API and Next.js frontend for salon businesses. Each business is a tenant. The starter uses one shared physical database and keeps a path toward a paid dedicated-database tier.

## Starter scope and limits

The initial application focuses on business onboarding and sign-in, tenant membership, roles and permissions, staff management, appointments, a service/product price catalog, customer bills, and draft payroll calculations. The business area provides a working foundation for these workflows, while a separate SaaS administration area manages the business registry and business suspension.

The dedicated-database tier is a future capability. Connection names and tenant ownership support that evolution, but a plan change must not be presented as a completed data migration. Dynamic plans, subscription terms, manual activation/renewal/cancellation, and automatic business trials are implemented. Automatic payment collection, database provisioning, payroll approval and payment, statutory payroll calculations, and production deployment hardening require later work.

Payroll amounts in this starter are draft calculations. The payroll jurisdiction has not been specified; there is no claim that the calculations satisfy local tax, pension, employment, or reporting requirements.

## Application boundaries

| Layer                | Responsibility                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Next.js frontend     | Sign-in, tenant selection, business dashboard/forms, `/access` management, and separate `/admin` administration |
| Laravel API          | Authentication, tenant membership and role checks, validation, calculations, and persistence                    |
| `central` connection | Platform identity, business registry, tenant roles, memberships, and future subscription/storage routing        |
| `tenant` connection  | Staff, appointments, payroll, and future business operations                                                    |

Both named connections initially point to the same physical MySQL database. Platform and business schema use separate migration files. Before introducing dedicated databases, add migration orchestration that selects only business schema for those databases. Operational models must use the `tenant` connection explicitly; identity and routing models use `central`. Automated backend tests use isolated temporary SQLite databases.

The frontend never determines whether a user may access a tenant or whether a payroll amount is authoritative. Laravel enforces those decisions for every request.

## Tenant ownership

Use a business-level tenant rather than creating a tenant for every employee. A business can gain multiple branches later. Branches remain inside that tenant's business data.

### Platform data

- Users and authentication tokens, including a platform administrator flag controlled by trusted server-side provisioning.
- Tenants, including stable identifiers, unique slugs, and active/suspended status.
- Tenant roles with a JSON list of permitted operations, stored centrally but owned by a specific tenant.
- Memberships linking users to tenants and referencing a role belonging to that same tenant.
- Subscription plans, current business subscriptions, and subscription term history.
- Future dedicated storage routing, connection/secret references, and provisioning state.

An employee record is separate from a user account. A salon may employ people who never sign in. A central account can optionally be linked to an employee through a stable identifier when that capability is added.

### Business data

Every operational record carries `tenant_id`, including after a move to a dedicated database. Initial records include employees, appointments, catalog items, orders and their line items, payroll runs, and payroll items. Add customer profiles, richer invoicing/payment records, expenses, attendance, and commission ledgers in later stages.

Keep tenant and record identifiers stable during extraction. Avoid SQL joins and required foreign keys across the logical `central`/`tenant` boundary. Those work in one database but become obstacles when a tenant moves. Use stable identifiers and explicit application lookups for central references.

Within business data, validate all relationships against the current tenant. Where supported by the schema, composite constraints such as `(tenant_id, employee_id)` referencing `(tenant_id, id)` add a database-level guard against cross-tenant links.

## Request authorization

The API is versioned under `/api/v1`. Tenant-scoped calls identify the selected business through `X-Tenant` using its slug. The starter uses stateless bearer tokens for local development. Consult the API source for the final endpoint and response contracts.

The request sequence is:

1. Authenticate the bearer token against central identity.
2. Resolve an active tenant from the provided slug.
3. Verify that the authenticated user is an active member of that tenant.
4. Resolve the membership's role and check the permission required by the action.
5. Establish tenant context and select the appropriate operational connection.
6. Run tenant-scoped validation, queries, and writes.
7. Clear tenant context when processing ends.

A slug, URL, header, or record identifier is a selector, not proof of permission. Ignore client-supplied ownership fields and assign `tenant_id` on the server. Do not allow a form payload to move a record between tenants.

Tenant-scoped lookups must include the current tenant. A request for another tenant's record must not return it merely because the identifier is known. Relationship validation, route binding, exports, and aggregate queries require the same boundary as ordinary lists.

Model scopes provide a useful default but are not a complete security boundary. Raw SQL, unscoped queries, background tasks, and administrative utilities need explicit tenant handling. A business query without a resolved tenant should fail closed.

For jobs and long-running workers, capture the tenant identifier in the job payload, resolve it when the job starts, and clear both context and connections in a `finally` block. Never reuse a previous job's tenant context.

Keep payroll and compensation access narrower than appointment access. Permission checks belong on the server, including requests made outside the UI.

## Business access management

The business `/access` area manages the selected tenant's roles and members. Role names are presentation labels; the API authorizes operations using the role's permission list. A user may have different permissions in different businesses through separate memberships.

The starter keeps roles and memberships in the central database. Every role has a tenant owner, and a membership can only reference a role from its own tenant. Validate that association on every create or update; accepting an arbitrary role identifier creates an escalation path even if the membership itself is tenant-scoped.

The built-in owner role is immutable. Business access management must not rename it, change its permissions, delete it, or permit an ordinary role editor to grant ownership. Owner membership changes require a separate, explicitly authorized ownership workflow if that feature is later introduced. Never allow an access-management request to silently remove the business's owner.

Use a server-defined catalog of permissions for supported actions, such as viewing and managing staff, appointments, payroll, roles, and members. Reject unknown permission values. Check permissions on both reads and writes; hiding a navigation item does not restrict an API request.

The initial permission catalog contains `dashboard.view`, `staff.view`, `staff.manage`, `appointments.view`, `appointments.manage`, `catalog.view`, `catalog.manage`, `orders.view`, `orders.manage`, `payroll.view`, `payroll.manage`, and `access.manage`. Staff viewing includes compensation data, so grant that permission accordingly. The seeded Owner role receives the entire catalog; Manager receives dashboard, staff, appointments, catalog, and billing access; Staff receives dashboard, appointment, catalog, and bill viewing. Custom roles can use a subset of the catalog.

Protect role/member management with its own permissions. Users who cannot manage access must not create members, assign roles, or edit a role's permissions. Re-evaluate memberships and permissions from current server data so revoking access is effective for subsequent requests rather than waiting for a stale browser state to expire.

Access management cannot grant permissions beyond the acting member's current permission set or change a role/member that already has permissions beyond that set. Users cannot edit/delete their own role or change/remove their own membership through these endpoints. Every owner membership is protected, which also prevents removing the final owner. Deleting an assigned role requires moving its members to another permitted role first.

Adding a member by an existing account's email attaches that identity to the selected business. It must not reset that account's password, overwrite its name, or change platform privileges. Creating a new identity requires a password. Account invitation and verified acceptance are a future extension.

### Access API contract

All routes below require authentication, `X-Tenant`, an active business membership, and `access.manage`.

| Method and path                      | Request/response                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `GET /api/v1/access`                 | Returns `roles`, `members`, and a `permissions` catalog of `{key, label}`             |
| `POST /api/v1/access/roles`          | Accepts `{name, permissions: string[]}`; returns `{data: role}` with status 201       |
| `PATCH /api/v1/access/roles/{id}`    | Accepts a new name and/or permissions; returns `{data: role}`                         |
| `DELETE /api/v1/access/roles/{id}`   | Deletes an unassigned, manageable role; returns status 204                            |
| `POST /api/v1/access/members`        | Accepts `{name, email, password?, role_id}`; returns `{data: member}` with status 201 |
| `PATCH /api/v1/access/members/{id}`  | Accepts `{role_id}`; returns `{data: member}`                                         |
| `DELETE /api/v1/access/members/{id}` | Removes a manageable membership; returns status 204                                   |

A role has `{id, name, permissions, is_owner}`. A member has `{id, user: {id, name, email}, role_id, role}`, where `id` is the membership UUID and `role` is its display name. Role/member identifiers are always resolved within the selected tenant. Member passwords are required only for a new account and currently require 8–72 characters.

The UI should use consistent labels and clear permission groups, show the active business, and explain why owner controls are locked. A simple modern visual system can use a small color palette, accessible text contrast, consistent spacing, and distinct visual treatment for privileged administration and business workflows.

## SaaS administration

The `/admin` area serves platform administrators. Its API guard checks the central user's administrator flag and is separate from tenant role permissions. Ordinary business owners must not gain platform access by editing a tenant role. Registration and business access forms must never accept or assign the platform administrator flag.

The initial administration scope is a dashboard and business registry with active/suspended status controls. Its API uses `GET /api/v1/admin/dashboard` and `PATCH /api/v1/admin/tenants/{id}`. Suspending a business blocks its tenant-scoped business APIs, including requests carrying a previously issued user token. Resuming it restores access subject to the user's current membership and permissions. Platform administration remains available to authorized platform administrators so they can manage suspended businesses. The platform administrator flag does not bypass membership or business permissions for operational APIs.

Platform administration should use explicit central queries and return only the operational information needed for business management. Keep access to staff compensation, payroll records, and other business data behind their own authorization boundary. If platform support needs tenant impersonation later, implement it as an explicit, audited feature.

The administration dashboard manages subscription plans and business access periods. It does not collect payments, provision dedicated databases, or migrate business data. A future storage entitlement must be tied to a completed provisioning or migration state before it changes database routing.

## Plans, subscriptions, and the free month

Plans and subscriptions live on the `central` connection. A plan has a name, description, integer price in minor units, billing currency, monthly/yearly interval, available modules, and an active/archived flag. A plan is a commercial offer; it does not replace the member's role permissions or change the tenant's database location.

Each newly created business receives a server-issued trial with every operational module available for one calendar month. Calculate the end using the salon's timezone and a month addition that clamps overflow, then persist UTC instants. The access interval is start-inclusive and end-exclusive. Sign-ins, member changes, and ordinary business edits cannot restart a trial. The migration grants existing businesses a one-time initial trial when installing this feature; it does not repeatedly renew trials.

The current subscription stores its plan name, price, currency, billing interval, included modules, and period boundaries as snapshots. Administrative changes append term history. Editing a plan affects later assignments; it does not silently rewrite an existing subscription's commercial terms. Archived plans remain visible to the administrator and cannot be newly assigned. A paid-plan assignment or renewal is a manual access record, not a successful payment-gateway settlement.

Operational access requires an active business, valid membership, unexpired trial or active subscription, an included module, and the action's role permission. The server checks access at request time, including the exact expiry boundary. No scheduler is needed to revoke expired access. The frontend uses the same subscription state to hide unavailable modules and explain expiry, while Laravel remains authoritative.

The business subscription endpoint remains accessible to authorized members after subscription expiry so they can see their terms and available plans. Platform administrators can assign/renew a plan or cancel access immediately. There is no self-service trial reset or client-controlled activation. Cancellation and expiry retain business records; they do not delete data. Manual business suspension remains independent of subscription status.

The module catalog is `staff`, `appointments`, `catalog`, `orders`, and `payroll`; billing requires catalog access for selecting priced items. Account/workspace and subscription status screens are separate from those modules. Plan management cannot grant a member a permission that their business role does not contain.

The API uses `GET/POST /api/v1/admin/plans`, `PATCH /api/v1/admin/plans/{id}`, `GET/PATCH /api/v1/admin/tenants/{id}/subscription`, and `GET /api/v1/subscription`. The frontend API conventions document the exact payloads. Automated checks cover trial creation, calendar boundaries, trial reuse prevention, expiry enforcement, permission/tenant boundaries, archived plans, and subscription snapshots.

## Core workflows

### Staff

Start with employee identity, contact information, employment status, and explicit compensation inputs. Store money using integer minor units or fixed-precision decimal fields; never binary floating-point database fields. Preserve the currency and document its precision.

Later, introduce compensation agreements with effective dates rather than overwriting rates that historical payroll depends on. Restrict access to compensation and other sensitive employee information.

### Appointments

Create and list appointments within the selected tenant and associate staff through tenant-scoped validation. Treat appointment state as explicit data, for example scheduled, completed, and cancelled.

Before adding online booking, enforce duration, employee availability, overlaps, branch timezone, cancellation rules, and idempotency on the server. Store timestamps consistently and display them in the business timezone. A scheduled appointment is not automatically a sale or payment.

### Services, products, and customer bills

The catalog stores a service/product type, name, integer price in minor currency units, and active status. Catalog records are deactivated rather than deleted when they have been used on past bills. Catalog viewing exposes prices and requires `catalog.view`; changing entries requires `catalog.manage`.

The simple order management workflow creates a customer bill from active catalog items. The API accepts a customer name and item identifiers/quantities, looks up the selected tenant's current prices inside a transaction, and stores item name, type, quantity, unit price, and line total snapshots. Editing a catalog entry cannot rewrite a past bill. A bill also preserves its currency internally and receives a generated `BILL-` identifier.

Amounts remain integer minor units throughout calculation. Quantities are whole numbers from 1 to 1,000; a bill supports up to 100 distinct catalog entries. Duplicate identifiers, inactive/foreign-tenant entries, and client-supplied prices/totals are rejected. The total is capped at 1,000,000,000,000 minor units. There are no tax, discount, inventory, refund, or payment-gateway calculations in this starter.

Bills begin unpaid or can be recorded as already paid with a cash/card/other method. An unpaid bill can later be marked paid manually. Repeating the same paid status/method is idempotent; a paid bill cannot be reopened or changed through these endpoints. Recording a card method does not process a card payment. These records are simple receipts/bills, not jurisdiction-specific tax invoices.

Appointments and bills are currently independent workflows. Creating a bill does not complete an appointment, reserve inventory, or generate a commission. Draft payroll commissions still use completed appointments and their saved commission rates. A later appointment-to-sale workflow should define the authoritative sales source before combining appointment and billing reporting.

### Catalog and billing API contract

These routes require authentication, `X-Tenant`, an active membership, and the corresponding view/manage permission.

| Method and path              | Request/response                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/catalog`        | Returns `{data: CatalogItem[]}` for the selected business, including inactive entries                                              |
| `POST /api/v1/catalog`       | Accepts `{type, name, price_minor, active?}`; returns `{data: CatalogItem}` with status 201                                        |
| `PATCH /api/v1/catalog/{id}` | Accepts changes to those catalog fields; returns `{data: CatalogItem}`                                                             |
| `GET /api/v1/orders`         | Returns `{data: Order[]}` for the latest 250 bills                                                                                 |
| `GET /api/v1/orders/{id}`    | Returns `{data: Order}`                                                                                                            |
| `POST /api/v1/orders`        | Accepts `{customer_name, items: [{catalog_item_id, quantity}], status?, payment_method?}`; returns `{data: Order}` with status 201 |
| `PATCH /api/v1/orders/{id}`  | Accepts `{status, payment_method?}` to record payment; returns `{data: Order}`                                                     |

`CatalogItem` has `{id, type: "service"|"product", name, price_minor, active}`. `Order` has `{id, number, customer_name, status: "unpaid"|"paid", payment_method: null|"cash"|"card"|"other", subtotal_minor, total_minor, created_at, paid_at, items}`. Each saved item has `{id, catalog_item_id, name, type, quantity, unit_price_minor, total_minor}`. A paid creation or transition requires a payment method; an unpaid bill requires no payment method. Bill customer details, line items, and totals cannot be edited or deleted through this starter API.

### Draft payroll

Draft payroll should display the selected period and the inputs used to calculate each employee's gross amount, additions, deductions, and net amount. Staff selection and source data must remain within the current tenant.

Do not silently treat incomplete attendance, sales, or commission data as a complete payroll record. The UI should make the draft status visible. A payroll draft is not evidence that an employee has been paid.

The production payroll workflow should add:

- Effective compensation agreements and explicit earning/deduction types.
- Currency, period, calculation version, input snapshots, and line-level explanations.
- Defined commission rules, including treatment of discounts, tax, cancellations, refunds, and shared service delivery.
- Separate draft, review, approval, and payment states with permitted transitions.
- Approval identity and timestamps, restricted payroll access, and an audit trail.
- Immutable approved totals; corrections create adjustment or reversal entries.
- Payment records and reconciliation, independent from approving the payroll calculation.
- Jurisdiction-specific rules verified against the business's actual location and employment arrangements.

Avoid recalculating historical payroll from current employee rates. Snapshot the values applied to each payroll item. If a refunded sale affects a commission already paid, record an explicit adjustment according to the agreed business rule.

## Path to dedicated tenant databases

Keep database location separate from a tenant's business identity. A future central routing record can contain storage mode (`shared` or `dedicated`), routing generation, provisioning state, schema version, and a reference to connection credentials. Avoid exposing database names or credentials to the browser.

Business code continues to use the `tenant` connection and tenant filters. The resolver changes which physical database that connection reaches. The business schema and application behavior stay consistent between tiers.

Do not change a connection on a long-running process without purging/reconnecting it and clearing tenant context. Cache routing carefully and invalidate it when the routing generation changes.

A dedicated database is a separate database, not necessarily a separate database server. Promise dedicated infrastructure only when the hosting tier actually provides it.

### Controlled migration procedure

1. Check eligibility, schema compatibility, capacity, and backup readiness.
2. Mark the tenant as migrating and suspend new writes, scheduled tasks, webhooks, and queued jobs for that tenant.
3. Drain or safely pause work already in progress.
4. Provision a database and apply the same operational migrations used by the shared deployment.
5. Copy all owned business records while preserving identifiers, relationships, timestamps, and payroll snapshots.
6. Verify row counts, relationships, financial totals, and representative reads; retain a recoverable source snapshot.
7. Atomically update the central route and routing generation, then purge connection pools and routing caches.
8. Run isolation and workflow smoke checks, then resume tenant traffic and background work.
9. Observe the cutover and remove old tenant rows only after the retention and recovery window has passed.

Rollback before new writes can switch routing back after verification. Rollback after new writes requires restoring or reconciling those writes; simply pointing the tenant at old shared rows can lose data. Define this recovery procedure before offering the upgrade commercially.

Dedicated tenant databases still need migration orchestration, backups, restore testing, monitoring, secret rotation, and capacity management. A successful schema migration for one tenant must not be confused with completion for the entire fleet.

## Other isolation boundaries

Tenant isolation also applies to cache keys, locks, exports, uploaded files, generated payslips, logs, notifications, and background jobs. Prefix or partition those resources by tenant and authorize every download. Never place payroll files in a publicly accessible directory.

Cross-tenant reporting belongs in an explicitly authorized platform workflow or a separate reporting pipeline. It must not bypass normal tenant isolation through an ordinary business API request.

## Staged development roadmap

| Stage               | Deliverable                                                                                                                                                                                   | Exit criteria                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1. Working starter  | Authentication, tenant membership, roles/permissions, business dashboard, staff, appointments, priced catalog, bills/manual payment status, draft payroll, and SaaS admin suspension controls | Local setup works; tenant isolation, permission, platform/admin separation, and billing calculation checks pass |
| 2. Daily operations | Customer profiles, appointment-to-sale linkage, refunds, richer payment records, expenses, branch settings                                                                                    | End-to-end business scenarios and financial totals verified                                                     |
| 3. Payroll workflow | Effective rates, attendance/commissions, snapshots, review, approval, adjustments, payslips                                                                                                   | Auditable calculations verified against agreed jurisdiction and business rules                                  |
| 4. SaaS operations  | Billing, plan entitlements, quotas, backups, observability, production authentication                                                                                                         | Enforced server-side entitlements, restore exercises, deployment checks                                         |
| 5. Dedicated tier   | Provisioning, migration jobs, routing, staged cutover and recovery                                                                                                                            | Rehearsed migration and rollback using representative tenant data                                               |

## Verification priorities

Security-sensitive backend changes warrant integration checks. Cover two tenants with records in both and prove that users cannot list, view, mutate, link, export, or aggregate the other tenant's data. Check rejected tenant selection, membership removal, role permissions on each action, missing tenant context, and server-assigned ownership.

Check that role assignment rejects another tenant's role, unknown permissions are rejected, owner-role mutation is blocked, and unauthorized role/member management fails. Verify that public registration cannot set platform administrator status, a business owner cannot call platform administration APIs, and suspension blocks existing tokens from business operations while an authorized administrator can still resume the business.

Payroll verification should use independently calculated examples, decimal/rounding boundaries, invalid periods, deductions exceeding earnings, and stable snapshots after compensation changes. Add approval and payment-state checks when those workflows exist.

Catalog/billing checks cover tenant isolation, independent arithmetic examples, price tampering, duplicate and inactive items, quantity/total limits, immutable line snapshots, paid-state transitions, idempotent payment retries, and lack of partial records when a bill is rejected. These tests do not assert payment-gateway settlement or inventory movements because neither feature is implemented.

Before deployment, settle the hosting domains, cookie/session or token strategy, HTTPS, CSRF/CORS configuration, rate limits, credential rotation, secret storage, audit retention, and backups. For a first-party browser application, evaluate an HttpOnly cookie/session setup rather than retaining the local starter's bearer-token storage pattern by default.

## Primary references

- [Laravel 12 database connections](https://laravel.com/framework/docs/12.x/database)
- [Laravel 12 Eloquent scopes](https://laravel.com/framework/docs/12.x/eloquent)

These framework features support connection selection and query defaults. The tenant authorization rules, migration procedure, and payroll controls above are application design decisions and must be implemented and verified explicitly.
