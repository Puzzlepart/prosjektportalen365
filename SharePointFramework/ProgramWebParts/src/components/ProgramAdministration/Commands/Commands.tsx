import * as strings from 'ProgramWebPartsStrings'
import _ from 'lodash'
import { ListMenuItem, Toolbar } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import React, { FC, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'
import { REMOVE_CHILD_PROJECTS, SET_IS_DELETING, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import {
  Toast,
  ToastBody,
  ToastTitle,
  Toaster,
  useId,
  useToastController
} from '@fluentui/react-components'

/**
 * Provides permission-gated add/remove actions and reports removal outcomes through toasts. For
 * usage statistics a removal that went through is counted once, however many projects it removed,
 * and one that failed by the error's own code, for the web part.
 */
export const Commands: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const toasterId = useId('toaster')
  const { dispatchToast } = useToastController(toasterId)
  const telemetry = useTelemetry()

  const items = [
    new ListMenuItem(
      strings.ProgramAdministrationAddChildsButtonLabel,
      strings.ProgramAdministrationAddChildsButtonDescription
    )
      .setDisabled(!context.state.userHasManagePermission)
      .setIcon('Add')
      .setOnClick(() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG()))
  ]

  const farItems = [
    new ListMenuItem(
      context.state.isDeleting
        ? strings.ProgramRemoveChildsDeletingLabel
        : strings.ProgramRemoveChildsButtonLabel,
      strings.ProgramRemoveChildsButtonDescription
    )
      .setIcon('Delete')
      .setDisabled(
        _.isEmpty(context.state.selectedProjects) ||
          !context.state.userHasManagePermission ||
          context.state.isDeleting
      )
      .setOnClick(() => {
        context.dispatch(SET_IS_DELETING(true))
        const projects = context.state.childProjects.filter(({ SiteId }) =>
          context.state.selectedProjects.includes(SiteId)
        )
        void context.props.dataAdapter
          .removeChildProjects(projects)
          .then(() => {
            const siteIdsToRemove = projects.map((p) => p.SiteId)
            context.dispatch(REMOVE_CHILD_PROJECTS({ siteIdsToRemove }))
            // Counted here and not in the reducer, once per removal that went through.
            telemetry.track('childProjects.removed')
            dispatchToast(
              <Toast>
                <ToastTitle>{strings.ChildrenRemoveToastTitle}</ToastTitle>
                <ToastBody>{strings.ChildrenRemoveToastMessage}</ToastBody>
              </Toast>,
              { intent: 'success' }
            )
          })
          .catch((error) => {
            telemetry.trackError(error)
            context.dispatch(SET_IS_DELETING(false))
            dispatchToast(
              <Toast>
                <ToastTitle>{strings.ChildrenRemoveErrorToastTitle}</ToastTitle>
                {error?.message && <ToastBody>{error.message}</ToastBody>}
              </Toast>,
              { intent: 'error' }
            )
          })
      })
  ]

  return (
    <>
      <Toolbar items={items} farItems={farItems} />
      <Toaster toasterId={toasterId} />
    </>
  )
}
