import moment from 'moment'
import domToImage from 'dom-to-image'
import { AttachmentFileInfo } from '@pnp/sp'

/**
 * Hook for capturing a report using `dom-to-image`. Returns a callback function
 * for capturing the selected report.
 *
 * @returns A function callback taking the report title as a parameter and returning a promise
 * of an attachment file info object (`AttachmentFileInfo`)
 */
export function useCaptureReport() {
  return async (title: string | number | boolean): Promise<AttachmentFileInfo> => {
    try {
      const statusReportHtml = document.getElementById('pp-statussection')
      const date = moment().format('YYYY-MM-DD HH:mm')
      const dateStamp = document.createElement('p')
      dateStamp.textContent = `${date}`
      dateStamp.style.textAlign = 'right'
      statusReportHtml.appendChild(dateStamp)
      statusReportHtml.style.backgroundColor = '#FFFFFF'
      const content = await domToImage.toBlob(statusReportHtml)
      const name = createValidAttachmentName(title, date)
      return { name, content } as AttachmentFileInfo
    } catch (error) {
      return null
    }
  }
}

/**
 * Creates a valid file name for the attachment file. The file name is
 * created by concatenating the title and date and replacing all
 * `/`, `\`, ` `, `:` with `-`, aswell as removing any invalid
 * characters (`~#%&*{}:<>?\/|"`).
 *
 * @param title The title of the project
 * @param date The current date in format `YYYY-MM-DD HH:mm`
 */
function createValidAttachmentName(title: string | number | boolean, date: string) {
  return `${(title + '_' + date)
    .toString()
    .replace(/\/|\\| |\:/g, '-')
    .replace(/[~#%&*{}:<>?\/|"]/gm, '')}.png`
}
