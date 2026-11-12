import domToImage from 'dom-to-image'
import { formatShortDate } from 'pp365-shared-library'

/**
 * Pixel density of the snapshot: sharp on high-DPI screens and when shown wider than the page.
 */
const SNAPSHOT_SCALE = 2

/**
 * Canvas-side limit used to reduce scaling for long reports.
 */
const MAX_CANVAS_SIDE = 16384

/**
 * Attribute marking the element the project title is placed at the top of in the snapshot:
 * the project information column of `SummarySection`.
 */
export const SNAPSHOT_TITLE_ANCHOR = 'data-snapshot-title-anchor'

/**
 * Reduces snapshot scaling toward the canvas-side limit, but never below the page's resolution.
 *
 * @param width Width of the report in CSS pixels
 * @param height Height of the report in CSS pixels
 */
export function getSnapshotScale(width: number, height: number): number {
  const longestSide = Math.max(width, height, 1)
  return Math.max(1, Math.min(SNAPSHOT_SCALE, MAX_CANVAS_SIDE / longestSide))
}

/**
 * Renders the node to a PNG blob at the given scale. dom-to-image has no scale option: it is
 * given a larger canvas, and the clone keeps its own size and is scaled up to fill it.
 */
function captureScaled(node: HTMLElement, scale: number): Promise<Blob> {
  const width = node.scrollWidth
  const height = node.scrollHeight
  return domToImage.toBlob(node, {
    width: Math.ceil(width * scale),
    height: Math.ceil(height * scale),
    style: {
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      width: `${width}px`,
      height: `${height}px`
    }
  })
}

/**
 * Adds the project title as a heading above the project information in the summary section,
 * or at the top of the report when the summary section shows no project information.
 */
function insertProjectTitle(statusReportHtml: HTMLElement, projectTitle: string): HTMLElement {
  const heading = document.createElement('h2')
  heading.textContent = projectTitle
  heading.style.margin = '0 0 12px 0'
  heading.style.fontSize = '24px'
  heading.style.fontWeight = '600'
  const anchor =
    statusReportHtml.querySelector<HTMLElement>(`[${SNAPSHOT_TITLE_ANCHOR}]`) ?? statusReportHtml
  anchor.insertBefore(heading, anchor.firstChild)
  return heading
}

/**
 * Adds the capture date and time below the report.
 */
function appendDateStamp(statusReportHtml: HTMLElement): HTMLElement {
  const dateStamp = document.createElement('p')
  dateStamp.textContent = formatShortDate(new Date(), true)
  dateStamp.style.textAlign = 'right'
  dateStamp.style.fontWeight = '600'
  statusReportHtml.appendChild(dateStamp)
  return dateStamp
}

/** Captures a scaled report PNG with a temporary project title and capture timestamp. */
export function useCaptureReportSnapshot() {
  return async (projectTitle?: string): Promise<Blob> => {
    const statusReportHtml = document.getElementById('pp-statussection')
    if (!statusReportHtml) return null
    const backgroundColor = statusReportHtml.style.backgroundColor
    const additions: HTMLElement[] = []
    try {
      if (projectTitle) additions.push(insertProjectTitle(statusReportHtml, projectTitle))
      additions.push(appendDateStamp(statusReportHtml))
      statusReportHtml.style.backgroundColor = '#FFFFFF'
      const scale = getSnapshotScale(statusReportHtml.scrollWidth, statusReportHtml.scrollHeight)
      if (scale > 1) {
        try {
          const content = await captureScaled(statusReportHtml, scale)
          if (content) return content
        } catch {
          // A browser that cannot draw the larger canvas still gets the page's resolution below.
        }
      }
      return await domToImage.toBlob(statusReportHtml)
    } catch {
      return null
    } finally {
      additions.forEach((element) => element.remove())
      statusReportHtml.style.backgroundColor = backgroundColor
    }
  }
}
