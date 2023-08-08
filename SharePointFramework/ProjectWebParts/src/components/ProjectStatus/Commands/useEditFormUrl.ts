import { StatusReport } from 'pp365-shared-library/lib/models'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'

/**
 * Returns a function that returns the edit form URL for a report.
 *
 * @returns A function callback
 */
export function useEditFormUrl() {
  const context = useContext(ProjectStatusContext)
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
