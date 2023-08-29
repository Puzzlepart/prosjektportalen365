import { IContextualMenuItem } from '@fluentui/react'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'
import SPDataAdapter from '../../../data'
import { useProjectStatusContext } from '../context'
import { SELECT_REPORT } from '../reducer'

/**
 * Hook for returning the report options for the report dropdown. Handles
 * dispatching the `SELECT_REPORT` action to the reducer when a report is
 * selected in the dropdown. The icon and color of the report is also
 * determined here based on the `published` property of the report.
 */
export function useReportOptions() {
  const context = useProjectStatusContext()
  const reportOptions: IContextualMenuItem[] = context.state.data.reports.map((report) => {
    const isCurrent = report.id === context.state.selectedReport?.id
    return {
      key: report.id.toString(),
      name: formatDate(report.created, true),
      onClick: () => {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(async () => {
          const reportWithAttachments = await SPDataAdapter.portal.getStatusReportAttachments(
            report
          )
          context.dispatch(SELECT_REPORT({ report: reportWithAttachments }))
        })()
      },
      canCheck: true,
      iconProps: {
        iconName: report.published ? 'BoxCheckmarkSolid' : 'CheckboxFill',
        style: {
          color: report.published ? '#2DA748' : '#D2D2D2'
        }
      },
      isChecked: isCurrent
    } as IContextualMenuItem
  })
  return reportOptions
}
