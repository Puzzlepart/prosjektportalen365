import domToImage from 'dom-to-image'
import { formatShortDate } from 'pp365-shared-library'

/**
 * Hook for capturing a report snapshot using `dom-to-image`. Returns a callback function
 * for capturing the selected report.
 *
 * @returns A promise of the blob content for the report snapshot (string)
 */
export function useCaptureReportSnapshot() {
  return async (): Promise<Blob> => {
    try {
      const statusReportHtml = document.getElementById('pp-statussection')
      // When the snapshot was taken, in the language of the page it was taken on.
      const date = formatShortDate(new Date(), true)
      const dateStamp = document.createElement('p')
      dateStamp.textContent = `${date}`
      dateStamp.style.textAlign = 'right'
      dateStamp.style.fontWeight = '600'
      statusReportHtml.appendChild(dateStamp)
      statusReportHtml.style.backgroundColor = '#FFFFFF'
      const content = await domToImage.toBlob(statusReportHtml)
      return content
    } catch {
      return null
    }
  }
}
