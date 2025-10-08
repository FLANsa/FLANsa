import { test, expect } from '@playwright/test'

test.describe('ZATCA Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the POS page
    await page.goto('/pos')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display POS interface', async ({ page }) => {
    // Check if the POS interface is visible
    await expect(page.locator('h1')).toContainText('نقطة البيع')
    
    // Check if menu items are loaded
    await expect(page.locator('[data-testid="menu-items"]')).toBeVisible()
  })

  test('should add items to cart', async ({ page }) => {
    // Add first item to cart
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    // Check if item is added to cart
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
    
    // Check if total is updated
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible()
  })

  test('should complete order with ZATCA integration', async ({ page }) => {
    // Add item to cart
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    // Click complete order button
    await page.locator('[data-testid="complete-order"]').click()
    
    // Wait for payment modal
    await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible()
    
    // Select payment method
    await page.locator('[data-testid="payment-cash"]').click()
    
    // Enter received amount
    await page.locator('[data-testid="received-amount"]').fill('100')
    
    // Click complete payment
    await page.locator('[data-testid="complete-payment"]').click()
    
    // Wait for navigation to print page
    await page.waitForURL('/print/*')
    
    // Check if print page is loaded
    await expect(page.locator('h1')).toContainText('طباعة الفاتورة')
  })

  test('should display ZATCA status badge', async ({ page }) => {
    // Complete an order first
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    await page.locator('[data-testid="complete-order"]').click()
    await page.locator('[data-testid="payment-modal"]').waitFor()
    await page.locator('[data-testid="payment-cash"]').click()
    await page.locator('[data-testid="received-amount"]').fill('100')
    await page.locator('[data-testid="complete-payment"]').click()
    
    // Wait for print page
    await page.waitForURL('/print/*')
    
    // Check if ZATCA status badge is visible
    await expect(page.locator('[data-testid="zatca-status"]')).toBeVisible()
  })

  test('should download XML file', async ({ page }) => {
    // Complete an order first
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    await page.locator('[data-testid="complete-order"]').click()
    await page.locator('[data-testid="payment-modal"]').waitFor()
    await page.locator('[data-testid="payment-cash"]').click()
    await page.locator('[data-testid="received-amount"]').fill('100')
    await page.locator('[data-testid="complete-payment"]').click()
    
    // Wait for print page
    await page.waitForURL('/print/*')
    
    // Click download XML button
    const downloadPromise = page.waitForEvent('download')
    await page.locator('[data-testid="download-xml"]').click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.xml$/)
  })

  test('should display QR code', async ({ page }) => {
    // Complete an order first
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    await page.locator('[data-testid="complete-order"]').click()
    await page.locator('[data-testid="payment-modal"]').waitFor()
    await page.locator('[data-testid="payment-cash"]').click()
    await page.locator('[data-testid="received-amount"]').fill('100')
    await page.locator('[data-testid="complete-payment"]').click()
    
    // Wait for print page
    await page.waitForURL('/print/*')
    
    // Check if QR code is visible
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible()
  })

  test('should handle ZATCA errors gracefully', async ({ page }) => {
    // Mock ZATCA API to return error
    await page.route('**/api/zatca/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'ZATCA service unavailable' })
      })
    })
    
    // Complete an order
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    await page.locator('[data-testid="complete-order"]').click()
    await page.locator('[data-testid="payment-modal"]').waitFor()
    await page.locator('[data-testid="payment-cash"]').click()
    await page.locator('[data-testid="received-amount"]').fill('100')
    await page.locator('[data-testid="complete-payment"]').click()
    
    // Wait for print page
    await page.waitForURL('/print/*')
    
    // Check if error status is displayed
    await expect(page.locator('[data-testid="zatca-status"]')).toContainText('فشل ZATCA')
  })
})

