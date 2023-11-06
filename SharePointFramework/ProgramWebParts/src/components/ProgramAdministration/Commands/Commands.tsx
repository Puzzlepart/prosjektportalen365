import * as strings from 'ProgramWebPartsStrings'
import _ from 'lodash'
import { ListMenuItem, Toolbar } from 'pp365-shared-library'
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

export const Commands: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const toasterId = useId('toaster')
  const { dispatchToast } = useToastController(toasterId)

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
        context.props.dataAdapter.removeChildProjects(projects).then((childProjects) => {
          context.dispatch(REMOVE_CHILD_PROJECTS({ childProjects }))
          dispatchToast(
            <Toast>
              <ToastTitle>{strings.ChildrenRemoveToastTitle}</ToastTitle>
              <ToastBody>{strings.ChildrenRemoveToastMessage}</ToastBody>
            </Toast>,
            { intent: 'success' }
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
