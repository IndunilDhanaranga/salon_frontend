# Salon workspace design

The workspace supports daily salon operations on desktop and phones: appointments, team management, checkout, expenses, payroll, and business administration. Favor readable forms, clear totals, and visible permission-dependent actions.

The current palette is black, champagne gold, and ivory. `src/styles/salon-theme.css` owns the global color tokens and shared UI refinements; feature styles use those tokens. The existing `pine`, `mint`, and `teal` variable names remain compatibility aliases for the current palette. Sidebar surfaces, borders, inputs, and secondary text also have semantic tokens so theme changes remain consistent across features. Champagne buttons use dark labels for contrast; black supports secondary actions, text, and navigation.

| Role             | Color     | Use                                           |
| ---------------- | --------- | --------------------------------------------- |
| Canvas           | `#f7f5ef` | Ivory workspace background                    |
| Surface          | `#fffdf7` | Light ivory panels, forms, dialogs            |
| Navigation       | `#191918` | Black sidebar and authentication panel        |
| Primary action   | `#d8c18d` | Champagne gold buttons with dark labels       |
| Selected surface | `#e5d3aa` | Champagne navigation selection and highlights |
| Text             | `#242421` | Primary content                               |
| Muted text       | `#6f6a60` | Secondary information                         |

Use DM Sans for body copy and Manrope for headings. Preserve red for errors/destructive actions, amber for pending states, and green for successful states. Statuses also need text labels. Core text, button, and semantic-state token pairs have automated AA contrast checks; this is not a full accessibility certification.

Mobile controls should provide at least 44px targets. Inputs use 16px text on small screens. Keep POS items, cart controls, form actions, and sidebar navigation usable without hover. Native dialogs provide focus containment and Escape behavior. Maintain the business and branch context when opening feature screens or submitting forms.

Sidebar visibility and major actions must use the same permission and subscription rules as the API. Payroll and access management additionally require access to all branches. Never rely on hidden controls as the authorization boundary.
