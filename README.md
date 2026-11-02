# Salon workspace

A Next.js frontend and Laravel API starter for running a salon SaaS. Each business has its own appointments, people, roles, prices, customer bills, and payroll drafts. A separate platform administration area manages business availability.

The adjacent `Haircut_backend` project uses **MySQL `haircut_master`**. Its `central` and `tenant` connections initially share this physical database. Dedicated business databases are a future deployment tier with a documented migration procedure.

## Start locally

Requirements: Node.js 20.9 or newer, npm, PHP 8.2 or newer, Composer, and MySQL. Installed versions are recorded in the lockfiles.

From `Haircut_backend`:

```powershell
composer install
# Only if .env does not exist:
Copy-Item .env.example .env
php artisan key:generate
```

Configure the private MySQL credentials in the backend `.env`, with `DB_DATABASE=haircut_master`. Then:

```powershell
php artisan migrate --database=central
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

From `Haircut_frontend`:

```powershell
npm install
# Optional: defaults already point to the local API.
Copy-Item .env.example .env.local
npm run dev
```

Open [the local application](http://127.0.0.1:3000). The local-only seeder creates these accounts:

To check on a real phone, run `npm run dev:lan` and open `http://<your-computer-LAN-address>:3000` on the same Wi-Fi network. The Next.js server still talks to Laravel locally, so the phone does not need direct access to port 8000. Desktop preview uses the default local-only dev command.

| Area | Email | Password |
| --- | --- | --- |
| Business owner | `demo@salon.test` | `password` |
| SaaS administrator | `admin@salon.test` | `password` |

The owner can switch between Studio One and The Cutting Room. The SaaS administrator can inspect businesses and suspend or resume them; platform status does not grant access to salon operations. Create a new workspace through registration to start with an empty business.

## Manage SaaS plans and subscriptions

Sign in with `admin@salon.test` and `password` to open SaaS administration. These are local demo credentials created by the backend seeder.

1. Open **Subscription plans** and create a plan with its name, price, billing currency, monthly/yearly interval, and included modules.
2. Open **Businesses**, choose **Manage subscription**, and assign a plan with its access expiry date. Activation and renewal are recorded manually; they do not charge a card or collect a payment.
3. Archive a plan to stop new assignments. Existing subscriptions keep the price and included modules recorded when they were assigned.
4. Use the business workspace's **Subscription** page to check the current plan, trial end date, and available plans.

Every new business receives **one calendar month free** from signup, with all operational modules available. Month-end dates are clamped to the next month's final day, so January 31 ends on February 28 (or 29 in a leap year). The server controls trial dates; changing a role, signing in again, or editing the business does not restart the trial.

When access expires or is cancelled, business records remain saved. The subscription page stays accessible so the business can see its status and contact the platform administrator. A subscription must allow a module and the signed-in member must have its required permission to use that module. Business suspension remains a separate administrative control.

The subscription migration gives existing businesses a one-time initial trial when introducing this feature, without replacing their operational data. Dedicated database routing remains a separate future capability.

## What works

- Sign-in, salon registration, sign-out, and switching authorized businesses.
- A permission-aware guided tour from sign-in or the workspace, with Next, Back, Skip, Close, and keyboard support.
- A visible Exit demo control that returns to sign-in and resets the demo so it can be reopened cleanly.
- Permission-driven sidebar navigation and create, edit, payment, payroll, and access actions, backed by Laravel authorization on every endpoint.
- Protected owner roles, custom roles, member assignment, and access revocation.
- Staff compensation records and appointments with completion/cancellation.
- Monthly base-salary and completed-service-commission payroll drafts.
- Service/product catalog with prices and availability.
- Mobile POS with searchable catalog, quantities, calculated totals, customer bills, manual payment recording, and printable receipts.
- Separate SaaS business/account directory and business suspension controls.
- Dynamic subscription plans, manual activation/renewal/cancellation, and automatic one-month business trials.
- Responsive forms, scrollable tables, keyboard-accessible dialogs, and a teal/mint theme.

Laravel calculates money in integer minor units. Bills preserve line descriptions, quantities, prices, and totals. Payroll preserves its calculation snapshots. Login tokens stay in an HttpOnly cookie managed by the Next.js API bridge; they are not stored in browser JavaScript storage.

## Code organization

```text
src/
  app/                       Thin App Router entries and server API bridge
  features/
    auth/                    Sign-in and registration
    workspace/               Session, tenant selection, shell, navigation
    business/
      dashboard/             Daily overview
      appointments/          Appointment book and booking workflow
      team/                  Staff details and compensation
      access/                Roles and membership management
      catalog/               Services, products, pricing
      billing/               POS, bills, receipt workflow
      payroll/               Draft payroll views
    platform/                SaaS administration
    tour/                    Guided walkthrough and demo controls
  lib/                       Shared API contracts, formatting, client helpers
  styles/                    Focused styles including mobile POS
```

Keep application routes thin, colocate feature components with their workflows, and reuse the shared API contract. Laravel owns authorization, tenancy, billing calculations, and payroll rules. UI checks make actions discoverable only when permitted; they do not replace backend checks.

See [architecture and phased development](docs/architecture.md) and [API conventions](docs/api-conventions.md). The backend README documents models, connections, migrations, API routes, testing, and payroll behavior.

## Check the projects

```powershell
npm run typecheck
npm run build
npm run format:check
```

From the backend:

```powershell
php artisan test --compact
php vendor/laravel/pint/builds/pint --test
```

Backend tests use isolated temporary test databases and do not reset `haircut_master`. The initial migrations and API flows have also been exercised on the local MySQL database.

## Scope and next phases

This is a working starter. Payroll currently generates immutable monthly drafts; statutory deductions, attendance proration, approval, payslips, and payment disbursement are still required for a full payroll product. Bill payment is a manual record, not a card charge. Tax, refunds, inventory, and fiscal invoice requirements are not implemented. Bills and appointments are independent; payroll commission currently comes from completed appointments.

Dedicated database provisioning, automatic recurring subscription payment collection, password recovery/invitations, audit trails, exports, background jobs, and deployment hardening remain on the roadmap. Do not run the local demo seeder against a production environment.
