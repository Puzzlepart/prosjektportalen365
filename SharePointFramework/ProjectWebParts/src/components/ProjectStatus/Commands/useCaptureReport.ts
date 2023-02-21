import moment from 'moment'
import domToImage from 'dom-to-image'

/**
 * Hook for capturing a report using dom-to-image.
 *
 * @returns A function callback taking the report title as a parameter
 */
export function useCaptureReport() {
  return async (title: string | number | boolean) => {
    try {
      const statusReportHtml = document.getElementById('pp-statussection')
      const date = moment().format('YYYY-MM-DD HH:mm')
      const dateStamp = document.createElement('p')
      dateStamp.textContent = `${date}`
      dateStamp.style.textAlign = 'right'
      statusReportHtml.appendChild(dateStamp)
      statusReportHtml.style.backgroundColor = '#FFFFFF'
      const content = await domToImage.toBlob(statusReportHtml)
      const name = `${(title + '_' + date).toString().replace(/\/|\\| |\:/g, '-')}.png`
      return { name, content }
    } catch (error) {
      return null
    }
  }
}
