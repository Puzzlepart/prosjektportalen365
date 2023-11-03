import * as strings from 'ProgramWebPartsStrings'
import _ from 'lodash'
import { ListMenuItem, Toolbar } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'
import { CHILD_PROJECTS_REMOVED, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'

export const Commands: FC = () => {
  const context = useContext(ProgramAdministrationContext)

  const items = [
    new ListMenuItem(strings.ProgramAdministrationAddChildsButtonText)
      .setDisabled(!context.state.userHasManagePermission)
      .setIcon('Add')
      .setOnClick(() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG()))
  ]

  const farItems = [
    new ListMenuItem(strings.ProgramRemoveChildsButtonText)
      .setIcon('Delete')
      .setDisabled(
        _.isEmpty(context.state.selectedProjects) || !context.state.userHasManagePermission
      )
      .setOnClick(() => {
        const projects = context.state.childProjects.filter(({ SiteId }) =>
          context.state.selectedProjects.includes(SiteId)
        )
        context.props.dataAdapter.removeChildProjects(projects).then((childProjects) => {
          context.dispatch(CHILD_PROJECTS_REMOVED({ childProjects }))
        })
      })
  ]

  return <Toolbar items={items} farItems={farItems} />
}
