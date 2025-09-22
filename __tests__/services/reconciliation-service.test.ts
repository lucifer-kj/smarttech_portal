import { reconciliationService } from '@/services/reconciliation-service'

// Note: This is a light test invoking logic without hitting network when possible
describe('reconciliationService', () => {
  it('exposes performConsistencyChecks', async () => {
    const checks = await reconciliationService.performConsistencyChecks()
    expect(checks).toHaveProperty('issues')
    expect(checks).toHaveProperty('details')
  })
})


