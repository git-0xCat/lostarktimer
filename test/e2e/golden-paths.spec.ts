import { test, expect } from '@playwright/test'

// Clean slate before every test so prior runs (or earlier specs in the
// same run) can't leak persisted state into a fresh assertion. Use a
// one-shot bootstrap visit + evaluate instead of addInitScript so a
// reload mid-test does NOT wipe persisted state we're trying to verify.
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
})

test.describe('routing', () => {
  test('/ redirects to /alarms', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/alarms$/)
  })
})

test.describe('alarms page', () => {
  test('renders header chrome and a date selector', async ({ page }) => {
    await page.goto('/alarms')
    await expect(
      page.getByRole('button', { name: 'Open alarm settings' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Previous day' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Next day' })
    ).toBeVisible()
  })

  test('next/prev day buttons advance the date', async ({ page }) => {
    await page.goto('/alarms')
    const dateButton = page.getByRole('button', { name: 'Selected date' })
    const initial = (await dateButton.textContent()) ?? ''
    await page.getByRole('button', { name: 'Next day' }).click()
    await expect(dateButton).not.toHaveText(initial)
  })

  test('region select switches persisted region', async ({ page }) => {
    await page.goto('/alarms')
    // The page initialises regionTZName to 'US West' on first visit.
    await expect(page.getByText('US West (UTC-7)')).toBeVisible()

    // Open the region trigger and pick a different option.
    await page.getByText('US West (UTC-7)').click()
    await page.getByRole('option', { name: /US East/ }).click()
    await expect(page.getByText('US East (UTC-4)')).toBeVisible()

    // Reload — selection should survive once the hook hydrates from
    // localStorage. Poll on the visible label rather than asserting
    // immediately because the hook reads inside useEffect.
    await page.reload()
    await expect(page.getByText('US East (UTC-4)')).toBeVisible({
      timeout: 5000,
    })
  })

  test('filter buttons highlight when selected', async ({ page }) => {
    await page.goto('/alarms')
    const allBtn = page.getByRole('button', { name: /^All\s/ })
    // 'All' is the default selection — primary fill present.
    await expect(allBtn).toHaveClass(/bg-primary/)

    // Pick another category by name from the sidebar.
    const fever = page.getByRole('button', { name: /Fever Time/ })
    await fever.click()
    await expect(fever).toHaveClass(/bg-primary/)
    await expect(allBtn).not.toHaveClass(/bg-primary/)
  })
})

test.describe('settings modal', () => {
  test('opens, toggles dark mode immediately, closes', async ({ page }) => {
    await page.goto('/alarms')
    await page.getByRole('button', { name: 'Open alarm settings' }).click()

    const dialog = page.getByRole('dialog', { name: /Alarm Settings/i })
    await expect(dialog).toBeVisible()

    // Click the Dark Mode row's label (full-row click target).
    const darkRow = dialog.getByText('Dark mode', { exact: false })
    const wasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    await darkRow.click()
    // Toggle should take effect without a reload.
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.classList.contains('dark')
        )
      )
      .toBe(!wasDark)

    await dialog.getByRole('button', { name: /All Done/i }).click()
    await expect(dialog).toBeHidden()
  })
})

test.describe('merchants page', () => {
  test('renders the WIP banner', async ({ page }) => {
    await page.goto('/merchants')
    await expect(page.getByText(/Work in Progress/i)).toBeVisible()
    await expect(page.getByText(/crowdsource/i)).toBeVisible()
  })

  test('settings modal opens', async ({ page }) => {
    await page.goto('/merchants')
    await page.getByRole('button', { name: 'Open merchant settings' }).click()
    await expect(
      page.getByRole('dialog', { name: /Merchant Settings/i })
    ).toBeVisible()
  })
})
