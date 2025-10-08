import { test as teardown } from '@playwright/test'

teardown('cleanup', async ({ page }) => {
  // Navigate to cleanup page if it exists
  await page.goto('/cleanup')
  
  // Or perform any necessary cleanup
  // For example, clear test data, reset state, etc.
  
  console.log('Global teardown completed')
})

