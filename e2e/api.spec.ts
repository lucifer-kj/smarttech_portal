import { test, expect, request } from '@playwright/test'

test('system health API responds', async ({ baseURL }) => {
  const context = await request.newContext()
  const res = await context.get(`${baseURL}/api/admin/system-health`)
  expect(res.status()).toBeLessThan(500)
})

test('servicem8 test-connection API responds', async ({ baseURL }) => {
  const context = await request.newContext()
  const res = await context.get(`${baseURL}/api/servicem8/test-connection`)
  expect(res.status()).toBeLessThan(500)
})


