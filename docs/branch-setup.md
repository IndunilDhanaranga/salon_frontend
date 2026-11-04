# Required first branch

Creating a workspace now leads directly to **Add your first branch**. Registration no longer silently creates a placeholder Main Branch. The owner enters the branch name, with optional code, phone, and address, and saves it before using business modules.

The setup page has no skip action or sidebar. It supports English/Sinhala, narrow screens, sign-out, authorized workspace switching, and platform administration for platform admins. Those controls do not unlock the pending business. After saving, session state and permissions refresh and the workspace opens on the member's first permitted page.

The API computes `needs_branch_setup` from the selected tenant's active branch records. Operational reads and writes return HTTP 409 until setup is complete, including direct API calls. Existing workspaces with an active branch are unaffected. Workspaces with no active branch receive the same required setup flow.

The first branch is active and main. An owner or authorized branch administrator with all-branch access can create it. A valid single-branch plan can complete setup without the Multiple branches feature; additional branch creation still requires that feature. Subscription and role restrictions remain enforced. The main branch cannot be deleted or deactivated.

The branch creation path serializes requests using the configured Laravel cache lock. Trial and subscription summaries report zero branches before setup and the actual active count afterward. The one-calendar-month trial still starts at workspace signup.

If branch creation succeeds but refreshing the session fails, the page offers Continue to workspace rather than submitting another branch. Refresh status rechecks server state, including when another administrator completes setup. Incomplete setup persists through reload and sign-in because the flag comes from server records.

Verification: five API feature tests cover pending-workspace reads/writes, validation, first/main branch creation, post-setup access, login persistence, tenant isolation, role restrictions, expiry, and single-branch plans. The full backend suite passed with 59 tests and 801 assertions. Frontend regression coverage includes the setup permission gate. Production compilation and TypeScript validation passed; live browser/device layout checks were not completed.
