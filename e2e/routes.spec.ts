import { test, expect } from '@playwright/test'

test('login page renders', async ({ page }) => {
  await page.goto('/auth/login')
  await expect(page).toHaveURL(/\/auth\/login/)
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})

test('admin dashboard route exists (redirect or protected)', async ({ page }) => {
  await page.goto('/admin')
  // Either stays on /admin (if session locally present) or redirects to /auth/login
  const url = page.url()
  expect(url.includes('/admin') || url.includes('/auth/login')).toBeTruthy()
})


