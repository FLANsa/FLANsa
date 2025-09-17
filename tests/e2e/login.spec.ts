import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/')
    
    // Check if login form is visible
    await expect(page.locator('h2')).toContainText('تسجيل الدخول')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/')
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Check for error message
    await expect(page.locator('.text-danger-700')).toBeVisible()
  })

  test('should navigate to PIN page on successful login', async ({ page }) => {
    await page.goto('/')
    
    // Fill in valid credentials (assuming test user exists)
    await page.fill('input[type="email"]', 'admin@bigdiet.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to PIN page
    await expect(page).toHaveURL('/pin')
    await expect(page.locator('h2')).toContainText('اختيار المحطة')
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/')
    
    const passwordInput = page.locator('input[type="password"]')
    const toggleButton = page.locator('button[type="button"]').first()
    
    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle button
    await toggleButton.click()
    
    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text')
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check if form is still visible and properly sized
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})
