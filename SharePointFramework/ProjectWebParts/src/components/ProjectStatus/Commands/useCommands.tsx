import { getId, IContextualMenuItem } from '@fluentui/react'
import { Spinner } from '@fluentui/react-components'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'
import strings from 'ProjectWebPartsStrings'
import React from 'react'
import { useProjectStatusContext } from '../context'
import { OPEN_PANEL } from '../reducer'
import { useCreateNewStatusReport } from './useCreateNewStatusReport'
import { useDeleteReport } from './useDeleteReport'
import { usePublishReport } from './usePublishReport'
import { useReportOptions } from './useReportOptions'

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
  const { state, dispatch } = useProjectStatusContext()
  const createNewStatusReport = useCreateNewStatusReport()
  const deleteReport = useDeleteReport()
  const publishReport = usePublishReport()
  const reportOptions = useReportOptions()
  const items: IContextualMenuItem[] = [
    state.userHasAdminPermission && {
      key: 'NEW_STATUS_REPORT',
      name: strings.NewStatusReportModalHeaderText,
      iconProps: { iconName: 'NewFolder' },
      disabled: state.data.reports.some((report) => !report.published) || !state.selectedReport?.published || state.isPublishing,
      onClick: () => {
        createNewStatusReport()
      }
    },
    state.selectedReport &&
    state.userHasAdminPermission && {
      key: 'DELETE_REPORT',
      name: strings.DeleteReportButtonText,
      iconProps: { iconName: 'Delete' },
      disabled: state.selectedReport?.published || state.isPublishing,
      onClick: () => {
        deleteReport()
      }
    },
    state.selectedReport &&
    state.userHasAdminPermission && {
      key: 'EDIT_REPORT',
      name: strings.EditReportButtonText,
      iconProps: { iconName: 'Edit' },
      disabled: state.selectedReport?.published || state.isPublishing,
      onClick: () => {
        dispatch(OPEN_PANEL({ name: 'EditStatusPanel' }))
      }
    },
    state.selectedReport &&
    state.userHasAdminPermission &&
    !state.isPublishing && {
      key: 'PUBLISH_REPORT',
      name: strings.PublishReportButtonText,
      iconProps: { iconName: 'PublishContent' },
      disabled: state.selectedReport?.published,
      onClick: () => {
        publishReport()
      }
    },
    state.isPublishing && {
      key: 'IS_PUBLISHING',
      onRender: () => (
        <Spinner
          label={strings.PublishReportSpinnerText}
          size='extra-small'
          labelPosition='after'
        />
      )
    }
  ].filter(Boolean)
  const farItems: IContextualMenuItem[] = [
    state.sourceUrl && {
      key: 'NAVIGATE_TO_SOURCE_URL',
      name: strings.NavigateToSourceUrlText,
      iconProps: { iconName: 'NavigateBack' },
      href: state.sourceUrl
    },
    state.selectedReport && {
      key: 'GET_SNAPSHOT',
      name: strings.GetSnapshotButtonText,
      iconProps: { iconName: 'Photo2' },
      disabled: !state.selectedReport?.snapshotUrl || state.isPublishing,
      onClick: () => {
        window.open(state.selectedReport?.snapshotUrl)
      }
    },
    state.data.reports.length > 0 && {
      key: 'REPORT_DROPDOWN',
      name: state.selectedReport
        ? formatDate(state.selectedReport.created, true)
        : '',
      iconProps: { iconName: 'FullHistory' },
      subMenuProps: { items: reportOptions },
      disabled: state.data.reports.length < 2
    },
    state.selectedReport && {
      id: getId('StatusIcon'),
      key: 'STATUS_ICON',
      name: state.selectedReport?.published
        ? strings.PublishedStatusReport
        : strings.NotPublishedStatusReport,
      iconProps: {
        iconName: state.selectedReport?.published ? 'BoxCheckmarkSolid' : 'CheckboxFill',
        style: {
          color: state.selectedReport?.published ? '#2DA748' : '#D2D2D2'
        }
      },
      disabled: true
    }
  ].filter(Boolean)
  return { props: { items, farItems } } as const
}
