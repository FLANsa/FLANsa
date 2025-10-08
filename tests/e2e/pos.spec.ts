import { test, expect } from '@playwright/test'

test.describe('POS System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pos')
    await page.waitForLoadState('networkidle')
  })

  test('should load POS interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('نقطة البيع')
    await expect(page.locator('[data-testid="menu-items"]')).toBeVisible()
    await expect(page.locator('[data-testid="cart"]')).toBeVisible()
  })

  test('should add and remove items from cart', async ({ page }) => {
    // Add item to cart
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    // Check item is in cart
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
    
    // Remove item from cart
    await page.locator('[data-testid="remove-item"]').click()
    
    // Check item is removed
    await expect(page.locator('[data-testid="cart-item"]')).not.toBeVisible()
  })

  test('should update item quantities', async ({ page }) => {
    // Add item to cart
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    // Increase quantity
    await page.locator('[data-testid="increase-quantity"]').click()
    
    // Check quantity is updated
    await expect(page.locator('[data-testid="item-quantity"]')).toContainText('2')
    
    // Decrease quantity
    await page.locator('[data-testid="decrease-quantity"]').click()
    
    // Check quantity is updated
    await expect(page.locator('[data-testid="item-quantity"]')).toContainText('1')
  })

  test('should calculate totals correctly', async ({ page }) => {
    // Add multiple items
    const items = page.locator('[data-testid="menu-item"]')
    await items.nth(0).click()
    await items.nth(1).click()
    
    // Check subtotal
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible()
    
    // Check VAT
    await expect(page.locator('[data-testid="vat"]')).toBeVisible()
    
    // Check total
    await expect(page.locator('[data-testid="total"]')).toBeVisible()
  })

  test('should handle different order modes', async ({ page }) => {
    // Test dine-in mode
    await page.locator('[data-testid="mode-dine-in"]').click()
    await expect(page.locator('[data-testid="mode-dine-in"]')).toHaveClass(/active/)
    
    // Test takeaway mode
    await page.locator('[data-testid="mode-takeaway"]').click()
    await expect(page.locator('[data-testid="mode-takeaway"]')).toHaveClass(/active/)
    
    // Test delivery mode
    await page.locator('[data-testid="mode-delivery"]').click()
    await expect(page.locator('[data-testid="mode-delivery"]')).toHaveClass(/active/)
  })

  test('should handle customer phone input', async ({ page }) => {
    // Click customer phone button
    await page.locator('[data-testid="customer-phone"]').click()
    
    // Wait for modal
    await expect(page.locator('[data-testid="customer-modal"]')).toBeVisible()
    
    // Enter phone number
    await page.locator('[data-testid="phone-input"]').fill('0501234567')
    
    // Save phone
    await page.locator('[data-testid="save-phone"]').click()
    
    // Check phone is displayed
    await expect(page.locator('[data-testid="customer-phone"]')).toContainText('0501234567')
  })

  test('should handle discount application', async ({ page }) => {
    // Add item to cart
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    // Click discount button
    await page.locator('[data-testid="discount"]').click()
    
    // Wait for modal
    await expect(page.locator('[data-testid="discount-modal"]')).toBeVisible()
    
    // Enter discount amount
    await page.locator('[data-testid="discount-input"]').fill('10')
    
    // Apply discount
    await page.locator('[data-testid="apply-discount"]').click()
    
    // Check discount is applied
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible()
  })

  test('should handle payment process', async ({ page }) => {
    // Add item to cart
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    // Click complete order
    await page.locator('[data-testid="complete-order"]').click()
    
    // Wait for payment modal
    await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible()
    
    // Select cash payment
    await page.locator('[data-testid="payment-cash"]').click()
    
    // Enter received amount
    await page.locator('[data-testid="received-amount"]').fill('100')
    
    // Check change calculation
    await expect(page.locator('[data-testid="change"]')).toBeVisible()
    
    // Complete payment
    await page.locator('[data-testid="complete-payment"]').click()
    
    // Wait for navigation to print page
    await page.waitForURL('/print/*')
  })

  test('should handle empty cart', async ({ page }) => {
    // Try to complete order with empty cart
    await page.locator('[data-testid="complete-order"]').click()
    
    // Check error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('السلة فارغة')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network error' })
      })
    })
    
    // Add item to cart
    const firstItem = page.locator('[data-testid="menu-item"]').first()
    await firstItem.click()
    
    // Try to complete order
    await page.locator('[data-testid="complete-order"]').click()
    
    // Check error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })
})