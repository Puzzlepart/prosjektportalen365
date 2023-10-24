import { useMemo } from 'react'
import { ListMenuItem } from 'pp365-shared-library'
import strings from 'ProjectWebPartsStrings'
import {
  bundleIcon,
  EditFilled,
  EditRegular,
  DeleteFilled,
  DeleteRegular,
  QuizNewFilled,
  QuizNewRegular,
  CloudArrowUpFilled,
  CloudArrowUpRegular,
  ArrowLeftFilled,
  ArrowLeftRegular,
  HistoryFilled,
  HistoryRegular,
  ImageFilled,
  ImageRegular,
  CheckmarkSquareFilled
} from '@fluentui/react-icons'
import { any } from 'underscore'
import { OPEN_PANEL, SELECT_REPORT } from '../../reducer'
import { useProjectStatusContext } from '../../context'
import { useCreateNewStatusReport } from '../useCreateNewStatusReport'
import { useDeleteReport } from '../useDeleteReport'
import { usePublishReport } from '../usePublishReport'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'
import SPDataAdapter from '../../../../data'

/**
 * Object containing icons used in the toolbar.
 */
const Icons = {
  QuizNew: bundleIcon(QuizNewFilled, QuizNewRegular),
  Edit: bundleIcon(EditFilled, EditRegular),
  Delete: bundleIcon(DeleteFilled, DeleteRegular),
  CloudArrowUp: bundleIcon(CloudArrowUpFilled, CloudArrowUpRegular),
  ArrowLeft: bundleIcon(ArrowLeftFilled, ArrowLeftRegular),
  Image: bundleIcon(ImageFilled, ImageRegular),
  History: bundleIcon(HistoryFilled, HistoryRegular),
  CheckmarkSquare: CheckmarkSquareFilled
}

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

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(
          strings.NewStatusReportLabel,
          !any(state.data.reports, (report) => !report.published)
            ? state.userHasAdminPermission
              ? strings.NewStatusReportDescription
              : strings.NewStatusReportDescriptionNoPermission
            : strings.UnpublishedStatusReportInfo
        )
          .setDisabled(
            state.data.reports.some((report) => !report.published) ||
              !state.selectedReport?.published ||
              state.isPublishing ||
              !state.userHasAdminPermission
          )
          .setIcon(Icons.QuizNew)
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
            .setIcon(Icons.Edit)
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
            .setIcon(Icons.CloudArrowUp)
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
            .setIcon(Icons.ArrowLeft)
            .setOnClick(() => {
              window.open(state.sourceUrl, '_self')
            }),
        state.selectedReport &&
          new ListMenuItem(strings.GetSnapshotButtonLabel, strings.GetSnapshotButtonDescription)
            .setDisabled(!state.selectedReport?.snapshotUrl || state.isPublishing)
            .setIcon(Icons.Image)
            .setWidth('fit-content')
            .setOnClick(() => {
              window.open(state.selectedReport?.snapshotUrl, '_self')
            }),
        new ListMenuItem(state.selectedReport ? formatDate(state.selectedReport.created) : '')
          .setIcon(Icons.History)
          .setWidth('fit-content')
          .setStyle({ minWidth: '145px' })
          .setDisabled(state.data.reports.length < 2)
          .setItems(
            state.data.reports.map((report) =>
              new ListMenuItem(formatDate(report.created, true), null)
                .setIcon(report.published ? Icons.CheckmarkSquare : '')
                .makeCheckable({
                  name: 'report',
                  value: formatDate(report.created, true)
                })
                .setOnClick(() => {
                  ;(async () => {
                    const reportWithAttachments =
                      await SPDataAdapter.portal.getStatusReportAttachments(report)
                    dispatch(SELECT_REPORT({ report: reportWithAttachments }))
                  })()
                })
            ),
            { report: [formatDate(state.selectedReport.created, true)] }
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
            .setIcon(Icons.Delete)
            .setOnClick(() => {
              deleteReport()
            })
      ].filter(Boolean),
    [state]
  )

  return { menuItems, farMenuItems }
}
