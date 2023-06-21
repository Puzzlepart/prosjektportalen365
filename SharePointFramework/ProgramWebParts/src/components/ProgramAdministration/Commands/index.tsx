import { CommandBar, ICommandBarItemProps } from '@fluentui/react'
import { isEmpty } from '@microsoft/sp-lodash-subset'
import * as strings from 'ProgramWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'
import { CHILD_PROJECTS_REMOVED, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'

export const Commands: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const items: ICommandBarItemProps[] = [
    {
      key: 'ProgramAddChilds',
      text: strings.ProgramAdministrationAddChildsButtonText,
      iconProps: { iconName: 'Add' },
      buttonStyles: { root: { border: 'none' } },
      onClick: () => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG()),
      disabled: !context.state.userHasManagePermission
    },
    {
      key: 'ProgramRemoveChilds',
      text: strings.ProgramRemoveChildsButtonText,
      iconProps: { iconName: 'Delete' },
      buttonStyles: { root: { border: 'none' } },
      disabled:
        isEmpty(context.state.selectedProjectsToDelete) || !context.state.userHasManagePermission,
      onClick: () => {
        context.props.dataAdapter
          .removeChildProjects(context.state.selectedProjectsToDelete)
          .then((childProjects) => {
            context.dispatch(CHILD_PROJECTS_REMOVED({ childProjects }))
          })
      }
    }
  ]

  return <CommandBar items={items} style={{ backgroundColor: 'white', marginBottom: '5px' }} />
}
