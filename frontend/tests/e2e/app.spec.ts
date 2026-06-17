import { test, expect, type Page } from '@playwright/test';

test.describe('fastHLD app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders toolbar and node palette', async ({ page }) => {
    await expect(page.getByText('fastHLD')).toBeVisible();
    await expect(page.getByText('Components')).toBeVisible();
    await expect(page.getByText('AWS')).toBeVisible();
    await expect(page.getByText('GCP')).toBeVisible();
    await expect(page.getByText('Azure')).toBeVisible();
  });

  test('text input is visible and accepts text', async ({ page }) => {
    const textarea = page.getByRole('textbox');
    await expect(textarea).toBeVisible();
    await textarea.fill('Add an EC2 instance');
    await expect(textarea).toHaveValue('Add an EC2 instance');
  });

  test('clicking a node in palette adds it to the canvas', async ({ page }) => {
    // Click EC2 in the palette
    await page.getByRole('button', { name: 'Add EC2' }).first().click();
    // A service node should appear in the canvas area
    await expect(page.locator('.react-flow__node')).toHaveCount(1, { timeout: 3000 });
  });

  test('toolbar shows node count', async ({ page }) => {
    await expect(page.getByText(/0 nodes/)).toBeVisible();
    await page.getByRole('button', { name: 'Add EC2' }).first().click();
    await expect(page.getByText(/1 node/)).toBeVisible();
  });

  test('undo button is disabled when no history', async ({ page }) => {
    const undoBtn = page.getByTitle(/undo/i);
    await expect(undoBtn).toBeDisabled();
  });

  test('undo restores state after adding a node', async ({ page }) => {
    await page.getByRole('button', { name: 'Add EC2' }).first().click();
    await expect(page.locator('.react-flow__node')).toHaveCount(1);
    await page.getByTitle(/undo/i).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(0);
  });

  test('export JSON button exists in toolbar', async ({ page }) => {
    await expect(page.getByTitle(/export json/i)).toBeVisible();
  });

  test('voice mic button is visible in input panel', async ({ page }) => {
    // Either the mic button or the "Voice N/A" message should be present
    const micOrNA = page.locator('[aria-label*="speak"], [aria-label*="recording"], text=Voice N/A');
    await expect(micOrNA.first()).toBeVisible({ timeout: 3000 });
  });
});
