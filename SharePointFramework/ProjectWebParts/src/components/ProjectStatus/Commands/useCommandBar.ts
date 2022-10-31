import { getId, IContextualMenuItem } from '@fluentui/react'
import { formatDate } from 'pp365-shared/lib/helpers'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { first } from 'underscore'
import { ProjectStatusContext } from '../context'
import { useDeleteReport } from './useDeleteReport'
import { usePublishReport } from './usePublishReport'
import { useRedirectNewStatusReport } from './useRedirectNewStatusReport'
import { useReportOptions } from './useReportOptions'

export function useCommands() {
  const context = useContext(ProjectStatusContext)
  const redirectNewStatusReport = useRedirectNewStatusReport()
  const deleteReport = useDeleteReport()
  const publishReport = usePublishReport()
  const reportOptions = useReportOptions()
  const items: IContextualMenuItem[] = [
    context.state.userHasAdminPermission && {
      key: 'NEW_STATUS_REPORT',
      name: strings.NewStatusReportModalHeaderText,
      iconProps: { iconName: 'NewFolder' },
      disabled: context.state.data.reports.filter((report) => !report.published).length !== 0,
      onClick: redirectNewStatusReport
    },
    context.state.selectedReport &&
      context.state.userHasAdminPermission && {
        key: 'DELETE_REPORT',
        name: strings.DeleteReportButtonText,
        iconProps: { iconName: 'Delete' },
        disabled: context.state.selectedReport?.published,
        onClick: () => {
          deleteReport()
        }
      },
    context.state.selectedReport &&
      context.state.userHasAdminPermission && {
        key: 'EDIT_REPORT',
        name: strings.EditReportButtonText,
        iconProps: { iconName: 'Edit' },
        href: context.state.selectedReport?.editFormUrl,
        disabled: context.state.selectedReport?.published
      },
    context.state.selectedReport &&
      context.state.userHasAdminPermission && {
        key: 'PUBLISH_REPORT',
        name: strings.PublishReportButtonText,
        iconProps: { iconName: 'PublishContent' },
        disabled: context.state.selectedReport?.published,
        onClick: () => {
          publishReport()
          context.setState({ isPublishing: true })
        }
      }
  ].filter(Boolean)
  const farItems: IContextualMenuItem[] = []
  if (context.state.sourceUrl) {
    farItems.push({
      key: 'NAVIGATE_TO_SOURC_EURL',
      name: strings.NavigateToSourceUrlText,
      iconProps: { iconName: 'NavigateBack' },
      href: context.state.sourceUrl
    })
  }
  if (context.state.selectedReport) {
    farItems.push({
      key: 'GET_SNAPSHOT',
      name: strings.GetSnapshotButtonText,
      iconProps: { iconName: 'Photo2' },
      disabled: !context.state.selectedReport?.hasAttachments,
      onClick: () => {
        window.open(first(context.state.selectedReport.attachments).ServerRelativeUrl)
      }
    })
  }
  if (context.state.data.reports.length > 0) {
    farItems.push({
      key: 'REPORT_DROPDOWN',
      name: context.state.selectedReport
        ? formatDate(context.state.selectedReport.created, true)
        : '',
      iconProps: { iconName: 'FullHistory' },
      subMenuProps: { items: reportOptions }
    })
  }
  if (context.state.selectedReport) {
    farItems.push({
      id: getId('StatusIcon'),
      key: 'STATUS_ICON',
      name: context.state.selectedReport?.published
        ? strings.PublishedStatusReport
        : strings.NotPublishedStatusReport,
      iconProps: {
        iconName: context.state.selectedReport?.published ? 'BoxCheckmarkSolid' : 'CheckboxFill',
        style: {
          color: context.state.selectedReport?.published ? '#2DA748' : '#D2D2D2'
        }
      },
      disabled: true
    })
  }
  return { props: { items, farItems } } as const
}
