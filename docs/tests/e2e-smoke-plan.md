# E2E Smoke Test Plan (Data Loading Reliability)

## Scope
- Validate that data loading is stable, resilient, and user experience remains smooth after FAZ 1–2 improvements.
- Cover search/pagination, refetch on focus/online, retry behavior surface, and collection operations.

## Assumptions
- App served locally at http://localhost:5173 or similar.
- Test user with valid credentials exists (if auth-gated features are tested). Otherwise tests skip auth-only flows.

## Core Scenarios

1) Initial Load (Whiskies List)
- Steps:
  - Navigate to `/whiskies`.
- Assertions:
  - Skeleton appears on first load, then a non-empty list is rendered (if DB has data).
  - No console errors.

2) Search with Debounce and Keep-Previous-Data
- Steps:
  - Type a 3+ character term in the search box.
  - Quickly change the term a couple of times.
- Assertions:
  - Mini skeleton appears while refetching, previous list remains visible until new results arrive.
  - No flicker to an empty state unless no results are found.
  - Final results correspond to the last term (no out-of-order response overriding).

3) Filter + Server-Side Pagination
- Steps:
  - Select a country and a type.
  - Change per-page count (e.g., 12 -> 24), navigate to page 2.
- Assertions:
  - List updates according to filters and pagination (correct count, different items across pages).
  - Mini skeleton shows during refetch; grid remains mounted.

4) Refetch on Window Focus and Online
- Steps:
  - Navigate to `/whiskies` and let it load.
  - Simulate losing focus (switch tab) -> return focus.
  - Simulate offline -> online transition (if test framework supports it) or trigger a mock network failure then restore.
- Assertions:
  - `whiskies` refetched on focus/online.
  - No unhandled errors.

5) Retry/Backoff (Network Glitch)
- Steps:
  - Temporarily block the `whiskies` request or throttle network to cause 5xx/timeout.
- Assertions:
  - The request is retried (observe small delays). Eventually data appears after network recovery.
  - If retries exhausted, a toast error appears and the app stays responsive.

6) Add to Collection (Authenticated)
- Pre:
  - User logged in.
- Steps:
  - On a whisky card, click “Add to collection”.
- Assertions:
  - Toast success.
  - Collection state updates (button becomes disabled or heart filled).
  - No duplicate items allowed.

7) Update Tasted Status (Authenticated)
- Pre:
  - User logged in, a collection entry exists.
- Steps:
  - Toggle “Mark as tasted”.
- Assertions:
  - Toast success.
  - UI reflects the tasted state.

8) Multilingual Hook Default Pagination
- Steps:
  - Ensure the multilingual hook is used or simulate the page where it’s active.
  - Trigger loading without explicit limit.
- Assertions:
  - Only one page (24 items) is fetched by default.
  - Refetch behavior mirrors the simple DB hook (mini skeleton, keep-previous-data, focus/online refetch).

## Non-Functional Checks
- Console free of uncaught errors.
- Network waterfall: no duplicate identical requests for same params in short interval.
- No severe layout shifts during refetch.

## Example: Playwright Skeleton (pseudo)
```ts
import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:5173'

test('search debounce keeps previous data and no flicker', async ({ page }) => {
  await page.goto(`${BASE}/whiskies`)
  await page.getByPlaceholder('Ara...').fill('mac')
  await page.getByPlaceholder('Ara...').fill('macallan')
  // Mini skeleton visible while refetching
  await expect(page.locator('[data-testid="whisky-skeleton-mini"]')).toBeVisible()
  // Grid remains mounted
  await expect(page.locator('[data-testid="whisky-grid"]')).toBeVisible()
  // Final results correspond to last query
  await expect(page.locator('[data-testid="whisky-card"]').first()).toBeVisible()
})
```

## Example: Cypress Skeleton (pseudo)
```js
describe('Whiskies - data reliability', () => {
  it('pagination and filters work without flicker', () => {
    cy.visit('/whiskies')
    cy.get('#countrySelect').select('Scotland')
    cy.get('#typeSelect').select('Single Malt')
    cy.get('#itemsPerPageSelectGrid').select('24')
    cy.contains(' / ').should('exist') // shows page X / Y
    cy.get('[data-testid="whisky-grid"]').should('exist')
  })
})
```

## Running Tests (proposal)
- Playwright: `npx playwright test` (after `npx playwright install`)
- Cypress: `npx cypress open` or `npx cypress run`

## Notes
- Auth flows can be stubbed with session cookies or conditional test skips.
- For network glitch tests, consider Playwright request interception or Cypress network stubbing.
