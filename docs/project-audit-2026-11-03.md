# Project review — 3–4 November 2026

This review inspected both existing projects, including the business modules added after the initial starter. Existing business data was retained. No live database reseeding, reset, or destructive migration was performed.

## Current application

| Area                | Implemented workflows                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Identity and access | Login, registration, tenant memberships, custom business roles, platform roles, permission-aware navigation            |
| Business operations | Branch selection and assignments, appointments, staff compensation, service/product pricing                            |
| Checkout            | Mobile POS, customer bills, manual payment recording, receipt printing, staff commission snapshots                     |
| Finance             | Business expenses, staff advances, date/branch reports, immutable monthly payroll drafts                               |
| SaaS administration | Business directory/status, dynamic plans, branch fees, subscription activation/cancellation, trial extensions, reports |
| Onboarding and UI   | Guided tour, exit-demo controls, English/Sinhala preference, responsive business and platform layouts                  |

Laravel remains responsible for authentication, tenancy, authorization, money calculations, and persistence. Next.js provides the workspace, shared API bridge, feature views, and browser session cookie. Central and operational connections currently share MySQL `haircut_master`. Dedicated databases remain a future provisioning and migration capability.

## Corrected findings

1. **Branch boundaries:** Added model-level branch scopes to direct identifier lookups and mutations, not only lists. Validate branch payloads against active branches owned by the current tenant and assigned to the caller. Reject conflicting branch selectors. Feature API calls inherit the toolbar's selected branch, and changing branches clears stale forms/data.
2. **Staff login safety:** Reject external `user_id` linking and password resets through staff records. Account creation requires access-management permission. Contact edits no longer overwrite central login details. Order options resolve only explicit staff/account links and never create or claim staff by matching names.
3. **Business-wide access:** Branch-restricted accounts cannot read/generate business-wide payroll or manage business-wide roles/members. Corresponding frontend actions are hidden.
4. **Payroll snapshots:** Preserve stored zero commissions instead of recalculating at a changed rate. Use exclusive next-month payment boundaries and aggregate all branches while retaining tenant scope.
5. **Report authorization and dates:** Financial reports require `reports.view`. Paid revenue follows payment date, with a legacy creation-date fallback. Month-end previous-month ranges no longer overflow. All-time reports start at actual data, and salary estimates account for calendar-month lengths.
6. **Dashboard cash figures:** Use paid bills for business-position revenue and net cash figures; keep completed-appointment metrics separate.
7. **Deductions:** Omitted dates default correctly. Aggregate summaries include the entire filtered result even when only 300 rows are returned. Branch options obey access restrictions.
8. **Platform escalation:** Role editors cannot grant permissions they lack, edit stronger roles, change their own access, or use a missing role to grant unrestricted administration.
9. **Limited platform roles:** Start on an allowed page, request only authorized resources, show loading errors, restrict overview shortcuts/actions, and filter tenant/user directories by their respective permissions.
10. **Subscription pricing:** Preserve a zero base price when recalculating branch fees. Branch management requires its module entitlement and permission. Plan forms now expose included branches and the additional branch fee.
11. **Branch history:** Removing a branch deactivates it, retaining staff, expense, membership, and historical references.
12. **Currency totals:** Platform MRR, ARR, and order GMV are grouped by currency; unlike amounts are no longer added and labeled LKR. Legacy LKR fields contain LKR values only. No currency conversion is performed.
13. **UI and onboarding:** Applied the black/champagne-gold/ivory theme across authentication, business and SaaS navigation, reports, forms, POS, and tours. Added missing theme tokens, improved readable type and mobile targets, used a native language dialog, updated document language, avoided overlapping onboarding dialogs, and prevented accidental form closure on internal whitespace.
14. **API bridge:** Restricted deduction options to read-only requests and retained origin, method, endpoint, tenant, and branch handling checks.

## Verification

- Baseline backend suite: 41 tests, 502 assertions passed.
- Final backend suite: **54 tests, 615 assertions passed** in 92.47 seconds, including the corrected salon-midnight report fixture.
- Added backend regression coverage for branch identifier/payload boundaries, unsafe staff identity changes, read-only options, payroll snapshots and month boundaries, report permissions/dates, deduction totals/default dates, platform permissions, branch lifecycle, plan entitlements, fee recalculation, and currency separation.
- Frontend: all 9 regression tests passed, including permission/subscription rules, platform landing pages, API bridge behavior, and core text/action/state contrast pairs.
- TypeScript validation and the optimized Next.js production build passed. The compiled CSS contains the black, champagne gold, and ivory theme tokens.
- Prettier and Pint formatting checks passed.
- An existing report fixture used the UTC calendar day for an Asia/Colombo salon. The fixture now uses salon-local appointment times and freezes the clock just after local midnight to verify that boundary deterministically.
- Read-only MySQL migration status confirmed every migration through `2026_11_03_000010_add_branch_pricing_to_subscription_plans` has run.
- Automated backend tests use isolated temporary SQLite files; they do not reset `haircut_master`.

## Verification limits and remaining product work

Browser automation stopped because its tool could not reliably determine the active Windows browser URL. No final desktop/mobile screenshot inspection or browser interaction walkthrough was completed. Responsive CSS, source behavior, core contrast pairs, TypeScript, and production compilation were checked, but those checks do not replace device testing.

Live MySQL was checked read-only. The automated API flows ran on SQLite; a separate staging MySQL run remains useful before deployment, particularly for locking, concurrency, and database-specific behavior.

Payroll is still a monthly draft calculator. It has no statutory deduction engine, employment-date proration, approval, payslip, or payment disbursement. Appointments and bills are independent commission sources; entering the same service in both is not automatically reconciled. Negative take-home pay is floored at zero and no carry-forward balance is maintained.

Subscription and customer payment actions record access/payment status rather than collecting money. Dedicated database provisioning, verified invitations/password recovery, transaction recovery across future separate databases, idempotent checkout, refunds/tax/inventory, comprehensive audit trails, and deployment hardening remain future work. Staff identity and operational-record creation span the logical central/tenant boundary and need explicit recovery handling before dedicated databases are introduced.

The existing feature organization was retained. Prettier and Pint normalize code style; new shared branch context, platform navigation policy, regression suites, and theme tokens fit that organization. The review improves the covered paths and does not assert that all possible defects or production risks have been eliminated.
