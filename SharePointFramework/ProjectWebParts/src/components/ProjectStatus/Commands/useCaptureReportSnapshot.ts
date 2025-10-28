import domToImage from 'dom-to-image'
import moment from 'moment'

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
      const date = moment().format('DD.MM.YYYY HH:mm')
      const dateStamp = document.createElement('p')
      dateStamp.textContent = `${date}`
      dateStamp.style.textAlign = 'right'
      dateStamp.style.fontWeight = '600'
      statusReportHtml.appendChild(dateStamp)
      statusReportHtml.style.backgroundColor = '#FFFFFF'

      // Get computed dimensions using getBoundingClientRect which accounts for zoom
      const rect = statusReportHtml.getBoundingClientRect()

      // Capture with explicit width and height to ensure consistent rendering
      // regardless of browser zoom level
      const content = await domToImage.toBlob(statusReportHtml, {
        width: rect.width,
        height: rect.height
      })
      return content
    } catch (error) {
      return null
    }
  }
}
