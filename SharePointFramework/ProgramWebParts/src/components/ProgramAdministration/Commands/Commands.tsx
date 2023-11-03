import * as strings from 'ProgramWebPartsStrings'
import _ from 'lodash'
import { ListMenuItem, Toolbar } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'
import { CHILD_PROJECTS_REMOVED, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import styles from './Commands.module.scss'

export const Commands: FC = () => {
  const context = useContext(ProgramAdministrationContext)

  const items = [
    new ListMenuItem(strings.ProgramAdministrationAddChildsButtonText)
      .setDisabled(!context.state.userHasManagePermission)
      .setIcon('Add')
      .setOnClick(() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())),
    new ListMenuItem(strings.ProgramRemoveChildsButtonText)
      .setIcon('Delete')
      .setDisabled(
        _.isEmpty(context.state.selectedProjectsToDelete) || !context.state.userHasManagePermission
      )
      .setOnClick(() => {
        context.props.dataAdapter
          .removeChildProjects( context.state.selectedProjectsToDelete)
          .then((childProjects) => {
            context.dispatch(CHILD_PROJECTS_REMOVED({ childProjects }))
          })
      })
  ]

  return (
    <div className={styles.commands}>
      <Toolbar items={items} />
    </div>
  )
}
