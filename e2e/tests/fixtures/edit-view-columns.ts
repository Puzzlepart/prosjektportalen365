import { Locator, Page } from '@playwright/test'

type Box = { x: number; y: number; width: number; height: number }

/** Where a dragged column is drawn, and whether it is what the pointer is on. */
export interface ColumnDrag {
  /** The dragged item's box in the viewport. */
  box: Box
  viewport: { width: number; height: number }
  /** The element under the pointer is the dragged item or inside it, so it is drawn on top. */
  underPointer: boolean
}

/** The panel header's own box, its close button's, and those of the actions beside it. */
export interface PanelHeaderLayout {
  header: Box
  close: Box
  actions: Array<Box & { text: string }>
}

/**
 * Measures the open panel's header after scrolling its body down, which is when the drawer draws
 * the divider under the header.
 */
export async function scrolledHeaderLayout(page: Page): Promise<PanelHeaderLayout> {
  await page.locator('.fui-OverlayDrawer .fui-DrawerBody').evaluate((body) => {
    body.scrollTop = body.scrollHeight
  })
  await page.waitForTimeout(300)
  return page.evaluate(() => {
    const box = (element: Element) => {
      const rect = element.getBoundingClientRect()
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    }
    const header = document.querySelector('.fui-OverlayDrawer .fui-DrawerHeader')
    if (!header) throw new Error('the panel has no header')
    const buttons = Array.from(header.querySelectorAll('button'))
    const close = buttons.find((button) =>
      /^(lukk|close)$/i.test(button.getAttribute('aria-label') ?? '')
    )
    if (!close) throw new Error('the panel header has no close button')
    return {
      header: box(header),
      close: box(close),
      actions: buttons
        .filter((button) => button !== close)
        .map((button) => ({ text: button.textContent?.trim() ?? '', ...box(button) }))
    }
  })
}

/**
 * Opens "Vis eller skjul kolonner" from the overview's "Legg til kolonne" header. Returns false
 * when the header is not offered, since only site admins get it.
 */
export async function openShowHideColumns(overview: Locator): Promise<boolean> {
  const page = overview.page()
  const addColumnHeader = overview
    .getByRole('columnheader', { name: /legg til kolonne|add column/i })
    .first()
  await overview.getByRole('columnheader').first().waitFor({ timeout: 60_000 })
  if (!(await addColumnHeader.isVisible().catch(() => false))) return false
  await addColumnHeader.click()
  await page.getByRole('menuitem', { name: /vis eller skjul kolonner|show or hide columns/i }).first().click()
  await movableColumns(page).first().waitFor({ timeout: 30_000 })
  return true
}

/** The panel's columns that can be dragged: only the selected (checked) ones can. */
function movableColumns(page: Page) {
  return page.locator('[data-rfd-draggable-id]:has(input[type="checkbox"]:checked)')
}

/**
 * Starts dragging the first movable column a few rows down and reports where the dragged item is
 * drawn, then cancels the drag with Escape, so nothing moves.
 */
export async function dragFirstColumn(page: Page): Promise<ColumnDrag> {
  const box = await movableColumns(page).first().boundingBox()
  if (!box) throw new Error('the first movable column has no box')
  const x = box.x + 40
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  // @hello-pangea/dnd starts a mouse drag only after the pointer has moved past a few pixels.
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(x, y + step * 8)
    await page.waitForTimeout(30)
  }
  await page.waitForTimeout(300)
  const pointer = { x, y: y + 80 }
  try {
    return await page.evaluate((point) => {
      const dragged = Array.from(
        document.querySelectorAll<HTMLElement>('[data-rfd-draggable-id]')
      ).find((element) => getComputedStyle(element).position === 'fixed')
      if (!dragged) throw new Error('no column is being dragged')
      const rect = dragged.getBoundingClientRect()
      // The library turns pointer events off on the dragged item, and hit testing skips such an
      // element; turned on for the one lookup, it tells whether the item is painted on top.
      const pointerEvents = dragged.style.pointerEvents
      dragged.style.pointerEvents = 'auto'
      const top = document.elementFromPoint(point.x, point.y)
      dragged.style.pointerEvents = pointerEvents
      return {
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        underPointer: Boolean(top && dragged.contains(top))
      }
    }, pointer)
  } finally {
    await page.keyboard.press('Escape')
    await page.mouse.up()
  }
}
