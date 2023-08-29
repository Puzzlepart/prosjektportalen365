import { StatusReport } from 'pp365-shared-library/lib/models'
import { useProjectStatusContext } from '../context'

/**
 * Returns a function that returns the edit form URL for a report.
 *
 * @returns A function callback
 */
export function useEditFormUrl() {
  const context = useProjectStatusContext()
  return (report: StatusReport) => {
    return [
      `${window.location.protocol}//${window.location.hostname}`,
      context.state.data.reportEditFormUrl,
      '?ID=',
      report.id,
      '&Source=',
      encodeURIComponent(`${window.location.origin}${window.location.pathname}`)
    ].join('')
  }
}
