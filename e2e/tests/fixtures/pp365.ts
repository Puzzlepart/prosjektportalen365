import { expect, test as base, Page } from '@playwright/test'

/**
 * Browser-side failures that mean the deployed bundles are broken, not the page content.
 * "Cannot find module" and "Failed to load component" are what an accidentally externalized
 * shared library or a missing chunk look like; "ChunkLoadError" is a bundle that 404s.
 */
const FATAL_CONSOLE_PATTERNS = [
  /cannot find module/i,
  /failed to load component/i,
  /chunkloaderror/i,
  /is not a function/i,
  /webpackJsonp/i
]

export interface Pp365Fixtures {
  /** Collects console errors and page errors while a test runs; fatal ones fail the test at the end. */
  consoleGuard: { errors: string[] }
  /** Navigates to a page of the hub or a project and waits for the SPFx canvas to render. */
  openPage: (path: string) => Promise<void>
}

export const test = base.extend<Pp365Fixtures>({
  consoleGuard: async ({ page }, use) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await use({ errors })
    const fatal = errors.filter((text) => FATAL_CONSOLE_PATTERNS.some((pattern) => pattern.test(text)))
    expect(fatal, `Fatal browser errors:\n${fatal.join('\n')}`).toEqual([])
  },
  openPage: async ({ page, consoleGuard }, use) => {
    void consoleGuard
    await use(async (path: string) => {
      await page.goto(path)
      await expectCanvasRendered(page)
    })
  }
})

export { expect }

/**
 * Waits until the modern page canvas has rendered at least one control zone, which is where every
 * SPFx web part mounts. Application customizers (extensions) render outside the canvas, so pages
 * that only host extensions should assert on their own elements instead.
 */
export async function expectCanvasRendered(page: Page): Promise<void> {
  await expect(page.locator('[data-automation-id="CanvasControl"], .ControlZone').first()).toBeVisible({
    timeout: 60_000
  })
}

/** Finds a web part on the page by the title text it renders (WebPartTitle or the SPFx title area). */
export function webPart(page: Page, title: string | RegExp) {
  return page.locator('[data-automation-id="CanvasControl"], .ControlZone').filter({ hasText: title })
}
