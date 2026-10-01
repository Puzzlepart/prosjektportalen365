import { expectListToFitContainer, measureTimelineList } from '../fixtures/timeline-list'
import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'

/**
 * The project timeline's list must fit the web part: the grid no wider than its container (no
 * horizontal scrollbar) and its columns sharing the container's width, as the v8 justified layout
 * did. Two regressions are pinned here: the shared grid once overrode Fluent's allowance for the
 * selection cell, which pushed every row 44px past the container whatever the columns did, and
 * the fit once ignored Fluent's per-column padding, which squeezed the last columns to their floor.
 * Measured at two widths, because both defects scaled with the container.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const hubUrl = baseURL.replace(/\/+$/, '').toLowerCase()
const pointsAtHub = !!projectUrl && projectUrl.toLowerCase() === hubUrl

test.describe('project timeline list', () => {
  test.skip(
    !projectUrl,
    'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping'
  )
  test.skip(
    pointsAtHub,
    `E2E_PROJECT_URL points at the hub (${projectUrl}); set it to a provisioned project site`
  )

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1920, height: 1080 }
  ]) {
    test(`fits the web part at ${viewport.width}px`, async ({
      page,
      openPage,
      resolvePage
    }, testInfo) => {
      await page.setViewportSize(viewport)
      await openPage(
        await resolvePage(projectUrl!, [
          'Prosjekttidslinje.aspx',
          'ProjectTimeline.aspx',
          'Tidslinje.aspx'
        ])
      )
      const metrics = await measureTimelineList(page)
      await testInfo.attach('metrics.json', {
        body: JSON.stringify(metrics, null, 2),
        contentType: 'application/json'
      })
      expectListToFitContainer(metrics)
    })
  }
})
