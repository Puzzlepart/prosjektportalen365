import moment from 'moment'
import domToImage from 'dom-to-image'

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
