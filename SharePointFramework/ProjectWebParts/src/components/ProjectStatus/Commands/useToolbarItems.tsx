import {
  CheckboxCheckedFilled,
  CheckboxCheckedRegular,
  DraftsFilled,
  DraftsRegular,
  bundleIcon
} from '@fluentui/react-icons'
import strings from 'ProjectWebPartsStrings'
import { ListMenuItem } from 'pp365-shared-library'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'
import { useMemo } from 'react'
import SPDataAdapter from '../../../data'
import { useProjectStatusContext } from '../context'
import { OPEN_PANEL, SELECT_REPORT } from '../reducer'
import { useCreateNewStatusReport } from './useCreateNewStatusReport'
import { useDeleteReport } from './useDeleteReport'
import { usePublishReport } from './usePublishReport'

/**
 * Returns an array of menu items for the toolbar in the ProjectStatus component.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems() {
  const { state, dispatch } = useProjectStatusContext()
  const createNewStatusReport = useCreateNewStatusReport()
  const deleteReport = useDeleteReport()
  const publishReport = usePublishReport()
  const hasUnpublishedReports = state.data.reports.some((report) => !report.published)

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(
          strings.NewStatusReportLabel,
          !hasUnpublishedReports
            ? state.userHasAdminPermission
              ? strings.NewStatusReportDescription
              : strings.NewStatusReportDescriptionNoPermission
            : strings.UnpublishedStatusReportInfo
        )
          .setDisabled(
            hasUnpublishedReports ||
              (state.selectedReport && !state.selectedReport?.published) ||
              state.isPublishing ||
              !state.userHasAdminPermission
          )
          .setIcon('QuizNew')
          .setOnClick(() => {
            createNewStatusReport()
          }),
        state.selectedReport &&
          new ListMenuItem(
            strings.EditReportButtonLabel,
            !state.selectedReport?.published
              ? state.userHasAdminPermission
                ? strings.EditReportButtonDescription
                : strings.EditReportButtonDescriptionNoPermission
              : strings.PublishedStatusReportInfo
          )
            .setDisabled(
              state.selectedReport?.published || state.isPublishing || !state.userHasAdminPermission
            )
            .setIcon('Edit')
            .setOnClick(() => {
              dispatch(OPEN_PANEL({ name: 'EditStatusPanel' }))
            }),
        state.selectedReport &&
          new ListMenuItem(
            state.isPublishing ? strings.PublishingReportLabel : strings.PublishReportButtonLabel,
            !state.selectedReport?.published
              ? state.userHasAdminPermission
                ? strings.PublishReportButtonDescription
                : strings.PublishReportButtonDescriptionNoPermission
              : strings.AlreadyPublishedReportInfo
          )
            .setDisabled(
              state.selectedReport?.published || state.isPublishing || !state.userHasAdminPermission
            )
            .setIcon('CloudArrowUp')
            .setOnClick(() => {
              publishReport()
            })
      ].filter(Boolean),
    [state]
  )

  const farMenuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        state.sourceUrl &&
          new ListMenuItem(strings.NavigateToSourceUrlText, strings.NavigateToSourceUrlText)
            .setIcon('ArrowLeft')
            .setOnClick(() => {
              window.open(state.sourceUrl, '_self')
            }),
        state.selectedReport &&
          new ListMenuItem(strings.GetSnapshotButtonLabel, strings.GetSnapshotButtonDescription)
            .setDisabled(!state.selectedReport?.snapshotUrl || state.isPublishing)
            .setIcon('Image')
            .setWidth('fit-content')
            .setOnClick(() => {
              window.open(state.selectedReport?.snapshotUrl, '_self')
            }),
        new ListMenuItem(
          state.selectedReport
            ? formatDate(state.selectedReport.publishedDate ?? state.selectedReport.modified)
            : strings.NoReportsFoundTitle
        )
          .setIcon('History')
          .setWidth('fit-content')
          .setStyle({ minWidth: '145px' })
          .setDisabled(state.data.reports.length < 2)
          .setItems(
            state.data.reports.map((report) =>
              new ListMenuItem(formatDate(report.publishedDate ?? report.modified, true), null)
                .setIcon(
                  report.published
                    ? bundleIcon(CheckboxCheckedFilled, CheckboxCheckedRegular)
                    : bundleIcon(DraftsFilled, DraftsRegular)
                )
                .makeCheckable({
                  name: 'report',
                  value: formatDate(report.publishedDate ?? report.modified, true)
                })
                .setOnClick(() => {
                  SPDataAdapter.portalDataService
                    .getStatusReportAttachments(report)
                    .then((reportWithAttachments) => {
                      dispatch(SELECT_REPORT({ report: reportWithAttachments }))
                    })
                })
            ),
            {
              report: [
                formatDate(
                  state.selectedReport?.publishedDate ?? state.selectedReport?.modified,
                  true
                )
              ]
            }
          ),
        state.selectedReport &&
          new ListMenuItem(
            strings.DeleteReportButtonLabel,
            !state.selectedReport?.published
              ? state.userHasAdminPermission
                ? strings.DeleteReportButtonDescription
                : strings.DeleteReportButtonDescriptionNoPermission
              : strings.PublishedStatusReportInfo
          )
            .setDisabled(
              state.selectedReport?.published || state.isPublishing || !state.userHasAdminPermission
            )
            .setIcon('Delete')
            .setOnClick(() => {
              deleteReport()
            })
      ].filter(Boolean),
    [state]
  )

  return { menuItems, farMenuItems }
}
