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
      const content = await domToImage.toBlob(statusReportHtml)
      return content
    } catch (error) {
      return null
    }
  }
}
