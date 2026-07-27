import { format } from '@fluentui/react'
import { getScopeSeriesKey } from 'pp365-shared-library'
import { formatDate } from 'pp365-shared-library/lib/util'
import strings from 'ProjectWebPartsStrings'
import _ from 'underscore'
import { IProjectStatusContext } from '../../ProjectStatus/context'
import { useProjectInformationContext } from '../context'

/**
 * Returns a project status context object per report series ("delprosjekt"),
 * based on the latest report per series in the project information context.
 * Reports are ordered newest-first, so the first report per scope key is the
 * latest. The default report series is rendered first, with the standard
 * header text — scoped series use their scope key as header text.
 */
export function useProjectStatusReport(): IProjectStatusContext[] {
  const context = useProjectInformationContext()
  if (context.props.hideStatusReport) return []
  const reports = context.state.data.reports ?? []
  const latestReportPerSeries = reports.filter(
    (report, index) =>
      reports.findIndex(
        ({ scopeKey }) => getScopeSeriesKey(scopeKey) === getScopeSeriesKey(report.scopeKey)
      ) === index
  )
  const orderedReports = [
    ...latestReportPerSeries.filter((report) => !report.scopeKey),
    ...latestReportPerSeries.filter((report) => !!report.scopeKey)
  ]

  return orderedReports.map((selectedReport) => {
    const reportStatus = selectedReport.published
      ? format(strings.PublishedStatusReport, formatDate(selectedReport.publishedDate))
      : format(strings.NotPublishedStatusReport, formatDate(selectedReport.modified))

    const projectStatusContext: IProjectStatusContext = {
      props: {
        title: selectedReport.scopeKey
          ? `${strings.ProjectInformationStatusReportHeaderText} – ${selectedReport.scopeKey}`
          : strings.ProjectInformationStatusReportHeaderText,
        description: strings.ProjectInformationStatusReportHeaderDescription
      },
      state: { ..._.omit(context.state, 'activePanel'), selectedReport, reportStatus }
    }
    return projectStatusContext
  })
}
