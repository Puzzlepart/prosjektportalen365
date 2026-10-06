import domToImage from 'dom-to-image'
import moment from 'moment'

/**
 * Pixel density of the snapshot: sharp on high-DPI screens and when shown wider than the page.
 */
const SNAPSHOT_SCALE = 2

/**
 * Largest canvas side every current browser can draw; longer reports get a lower scale.
 */
const MAX_CANVAS_SIDE = 16384

/**
 * Attribute marking the element the project title is placed at the top of in the snapshot:
 * the project information column of `SummarySection`.
 */
export const SNAPSHOT_TITLE_ANCHOR = 'data-snapshot-title-anchor'

/**
 * The scale to capture a report of the given size at: `SNAPSHOT_SCALE`, lowered so that no
 * side of the canvas exceeds `MAX_CANVAS_SIDE`, and never below 1.
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
 *
 * @param node The node to render
 * @param scale The scale to render at
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
 *
 * @param statusReportHtml The status report element
 * @param projectTitle The title to show
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
 *
 * @param statusReportHtml The status report element
 */
function appendDateStamp(statusReportHtml: HTMLElement): HTMLElement {
  const dateStamp = document.createElement('p')
  dateStamp.textContent = moment().format('DD.MM.YYYY HH:mm')
  dateStamp.style.textAlign = 'right'
  dateStamp.style.fontWeight = '600'
  statusReportHtml.appendChild(dateStamp)
  return dateStamp
}

/**
 * Hook for capturing a report snapshot using `dom-to-image`. Returns a callback function
 * for capturing the selected report with the project title above it and the capture date
 * below it, at twice the page's resolution where the browser can draw it and at the page's
 * resolution otherwise. The title, date and white background are on the page only while
 * the snapshot is taken.
 *
 * @returns A callback taking the project title, returning a promise of the snapshot blob
 */
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
