import { getId, IContextualMenuItem, Spinner, SpinnerSize } from '@fluentui/react'
import { formatDate } from 'pp365-shared/lib/helpers'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { first } from 'underscore'
import { ProjectStatusContext } from '../context'
import { REPORT_PUBLISHING } from '../reducer'
import { useDeleteReport } from './useDeleteReport'
import { useEditFormUrl } from './useEditFormUrl'
import { usePublishReport } from './usePublishReport'
import { useRedirectNewStatusReport } from './useRedirectNewStatusReport'
import { useReportOptions } from './useReportOptions'
import React from 'react'

/**
 * Component logic hook for `Commands`. This hook is used to generate the commands for the `CommandBar` component.
 *
 * The following commands are conditionally rendered:
 * - `NEW_STATUS_REPORT`: Renders a command to create a new status report. This command is disabled if there are any unpublished reports.
 * - `DELETE_REPORT`: Renders a command to delete the selected report. This command is disabled if the selected report is published or if the component is publishing a report.
 * - `EDIT_REPORT`: Renders a command to edit the selected report. This command is disabled if the selected report is published or if the component is publishing a report.
 * - `PUBLISH_REPORT`: Renders a command to publish the selected report. This command is disabled if the selected report is published or if the component is publishing a report.
 * - `IS_PUBLISHING`: Renders a spinner if the component is publishing a report.
 * - `NAVIGATE_TO_SOURCE_URL`: Renders a command to navigate to the source URL.
 * - `GET_SNAPSHOT`: Renders a command to get the snapshot of the selected report. This command is disabled if the selected report does not have any attachments or if the component is publishing a report.
 * - `REPORT_DROPDOWN`: Renders a dropdown menu of all the reports. This command is disabled if there are no reports.
 * - `STATUS_ICON`: Renders an icon to indicate the status of the selected report. This command is disabled and only for display purposes.
 */
export function useCommands() {
  const context = useContext(ProjectStatusContext)
  const redirectNewStatusReport = useRedirectNewStatusReport()
  const deleteReport = useDeleteReport()
  const publishReport = usePublishReport()
  const reportOptions = useReportOptions()
  const getEditFormUrl = useEditFormUrl()
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
        disabled: context.state.selectedReport?.published || context.state.isPublishing,
        onClick: () => {
          deleteReport()
        }
      },
    context.state.selectedReport &&
      context.state.userHasAdminPermission && {
        key: 'EDIT_REPORT',
        name: strings.EditReportButtonText,
        iconProps: { iconName: 'Edit' },
        href: getEditFormUrl(context.state.selectedReport),
        disabled: context.state.selectedReport?.published || context.state.isPublishing
      },
    context.state.selectedReport &&
      context.state.userHasAdminPermission &&
      !context.state.isPublishing && {
        key: 'PUBLISH_REPORT',
        name: strings.PublishReportButtonText,
        iconProps: { iconName: 'PublishContent' },
        disabled: context.state.selectedReport?.published,
        onClick: () => {
          context.dispatch(REPORT_PUBLISHING())
          publishReport()
        }
      },
    context.state.isPublishing && {
      key: 'IS_PUBLISHING',
      onRender: () => {
        return (
          <Spinner
            label={strings.PublishReportSpinnerText}
            size={SpinnerSize.small}
            labelPosition='right'
          />
        )
      }
    }
  ].filter(Boolean)
  const farItems: IContextualMenuItem[] = []
  if (context.state.sourceUrl) {
    farItems.push({
      key: 'NAVIGATE_TO_SOURCE_URL',
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
      disabled: !context.state.selectedReport?.hasAttachments || context.state.isPublishing,
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
