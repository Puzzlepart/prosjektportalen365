import { format } from '@fluentui/react'
import { formatDate } from 'pp365-shared-library/lib/util'
import strings from 'ProjectWebPartsStrings'
import _ from 'underscore'
import { IProjectStatusContext } from '../../ProjectStatus/context'
import { useProjectInformationContext } from '../context'

/**
 * Returns a project status context object per status page series, based on
 * the latest report per series in the project information context. Reports
 * are ordered newest-first, so the first report per series key is the latest.
 * The default status page series is rendered first, with the standard header
 * text — additional series use their status page title as header text.
 */
export function useProjectStatusReport(): IProjectStatusContext[] {
  const context = useProjectInformationContext()
  if (context.props.hideStatusReport) return []
  const reports = context.state.data.reports ?? []
  const latestReportPerSeries = reports.filter(
    (report, index) =>
      reports.findIndex(({ statusPageId }) => statusPageId === report.statusPageId) === index
  )
  const orderedReports = [
    ...latestReportPerSeries.filter((report) => !report.statusPageId),
    ...latestReportPerSeries.filter((report) => !!report.statusPageId)
  ]

  return orderedReports.map((selectedReport) => {
    const reportStatus = selectedReport.published
      ? format(strings.PublishedStatusReport, formatDate(selectedReport.publishedDate))
      : format(strings.NotPublishedStatusReport, formatDate(selectedReport.modified))

    const projectStatusContext: IProjectStatusContext = {
      props: {
        title: selectedReport.statusPageId
          ? selectedReport.statusPageTitle || strings.ProjectInformationStatusReportHeaderText
          : strings.ProjectInformationStatusReportHeaderText,
        description: strings.ProjectInformationStatusReportHeaderDescription
      },
      state: { ..._.omit(context.state, 'activePanel'), selectedReport, reportStatus }
    }
    return projectStatusContext
  })
}
