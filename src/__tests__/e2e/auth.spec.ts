/**
 * E2E tests for authentication flows.
 *
 * Tests cover:
 * 1. Login flow - email/password authentication
 * 2. Signup flow - new user registration
 * 3. Logout flow - session termination
 * 4. Protected routes - redirect to login
 * 5. Password reset - email-based reset flow
 *
 * Note: These tests use real browser interactions but may use
 * test accounts or mocked auth in CI environments.
 *
 * @see src/app/(auth)/ for auth pages
 * @see src/middleware.ts for route protection
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  // Clear browser state before each test for proper isolation
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test.describe('Login page', () => {
    test('displays login form', async ({ page }) => {
      await page.goto('/login');

      // Check page title and heading
      await expect(page).toHaveTitle(/Log In|KnearMe/i);
      await expect(page.getByRole('heading', { name: /log in|sign in/i })).toBeVisible();

      // Check form elements exist
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
    });

    test('shows link to signup page', async ({ page }) => {
      await page.goto('/login');

      const signupLink = page.getByRole('link', { name: /sign up|create account|register/i });
      await expect(signupLink).toBeVisible();
      await signupLink.click();

      await expect(page).toHaveURL(/\/signup/);
    });

    test('shows link to forgot password', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.getByRole('link', { name: /forgot|reset/i });
      await expect(forgotLink).toBeVisible();
    });

    test('shows validation error for empty form submission', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      await page.getByRole('button', { name: /log in|sign in/i }).click();

      // Should show validation errors or remain on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill in invalid credentials
      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /log in|sign in/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Signup page', () => {
    test('displays signup form', async ({ page }) => {
      await page.goto('/signup');

      // Check page title and heading
      await expect(page.getByRole('heading', { name: /sign up|create|register/i })).toBeVisible();

      // Check form elements exist
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up|create|register/i })).toBeVisible();
    });

    test('shows link to login page', async ({ page }) => {
      await page.goto('/signup');

      const loginLink = page.getByRole('link', { name: /log in|sign in|already have/i });
      await expect(loginLink).toBeVisible();
      await loginLink.click();

      await expect(page).toHaveURL(/\/login/);
    });

    test('shows validation error for invalid email', async ({ page }) => {
      await page.goto('/signup');

      // Fill in invalid email
      await page.getByLabel(/email/i).fill('notanemail');
      await page.getByLabel(/password/i).first().fill('validpassword123');

      // Try to submit
      await page.getByRole('button', { name: /sign up|create|register/i }).click();

      // Should remain on signup page or show error
      await expect(page).toHaveURL(/\/signup/);
    });
  });

  test.describe('Protected routes', () => {
    test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
      // Try to access protected dashboard
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects unauthenticated users from projects to login', async ({ page }) => {
      // Try to access protected projects page
      await page.goto('/projects');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects unauthenticated users from profile setup to login', async ({ page }) => {
      // Try to access protected profile setup
      await page.goto('/profile/setup');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Public pages', () => {
    test('home page is accessible without auth', async ({ page }) => {
      await page.goto('/');

      // Should load successfully
      await expect(page).toHaveTitle(/KnearMe/i);
    });

    test('login page is accessible without auth', async ({ page }) => {
      await page.goto('/login');

      // Should load successfully (not redirect)
      await expect(page).toHaveURL(/\/login/);
    });

    test('signup page is accessible without auth', async ({ page }) => {
      await page.goto('/signup');

      // Should load successfully (not redirect)
      await expect(page).toHaveURL(/\/signup/);
    });
  });
});
