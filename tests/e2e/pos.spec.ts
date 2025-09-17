import { test, expect } from '@playwright/test'

test.describe('POS System', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to POS
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@bigdiet.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Select terminal and enter PIN
    await page.waitForURL('/pin')
    await page.click('button:has-text("المحطة 01")')
    await page.fill('input[name="pin"]', '1234')
    await page.click('button[type="submit"]')
    
    // Should be on POS page
    await page.waitForURL('/sell')
  })

  test('should display menu items', async ({ page }) => {
    // Check if menu items are visible
    await expect(page.locator('h1')).toContainText('نقطة البيع')
    await expect(page.locator('.grid > div').first()).toBeVisible()
  })

  test('should add item to cart', async ({ page }) => {
    // Click on first menu item
    const firstItem = page.locator('.grid > div').first()
    await firstItem.click()
    
    // Check if item was added to cart
    await expect(page.locator('text=السلة (1)')).toBeVisible()
  })

  test('should update cart quantity', async ({ page }) => {
    // Add item to cart
    const firstItem = page.locator('.grid > div').first()
    await firstItem.click()
    
    // Increase quantity
    const plusButton = page.locator('button:has-text("+")').first()
    await plusButton.click()
    
    // Check if quantity is updated
    await expect(page.locator('text=2')).toBeVisible()
  })

  test('should remove item from cart', async ({ page }) => {
    // Add item to cart
    const firstItem = page.locator('.grid > div').first()
    await firstItem.click()
    
    // Decrease quantity to 0
    const minusButton = page.locator('button:has-text("-")').first()
    await minusButton.click()
    
    // Check if cart is empty
    await expect(page.locator('text=السلة فارغة')).toBeVisible()
  })

  test('should change order mode', async ({ page }) => {
    // Click on takeaway mode
    await page.click('button:has-text("طلب خارجي")')
    
    // Check if mode is selected
    await expect(page.locator('button:has-text("طلب خارجي")')).toHaveClass(/bg-primary-600/)
  })

  test('should display order summary', async ({ page }) => {
    // Add item to cart
    const firstItem = page.locator('.grid > div').first()
    await firstItem.click()
    
    // Check if totals are displayed
    await expect(page.locator('text=المجموع الفرعي')).toBeVisible()
    await expect(page.locator('text=ضريبة القيمة المضافة')).toBeVisible()
    await expect(page.locator('text=المجموع الكلي')).toBeVisible()
  })

  test('should enable checkout button when cart has items', async ({ page }) => {
    // Initially checkout should be disabled
    const checkoutButton = page.locator('button:has-text("الدفع")')
    await expect(checkoutButton).toBeDisabled()
    
    // Add item to cart
    const firstItem = page.locator('.grid > div').first()
    await firstItem.click()
    
    // Checkout should now be enabled
    await expect(checkoutButton).toBeEnabled()
  })

  test('should clear cart', async ({ page }) => {
    // Add item to cart
    const firstItem = page.locator('.grid > div').first()
    await firstItem.click()
    
    // Clear cart
    const clearButton = page.locator('button[title="Clear cart"]')
    await clearButton.click()
    
    // Check if cart is empty
    await expect(page.locator('text=السلة فارغة')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if layout adapts to mobile
    await expect(page.locator('.grid')).toBeVisible()
    await expect(page.locator('text=نقطة البيع')).toBeVisible()
  })
})
