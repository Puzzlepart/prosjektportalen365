import { Spinner } from 'office-ui-fabric-react'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar'
import * as strings from 'ProgramWebPartsStrings'
import React, { FunctionComponent, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'

export const Commands: FunctionComponent = () => {
  const context = useContext(ProgramAdministrationContext)
  const getLoadingBar = () => {
    const commandBarButtonAs = () => (
      <div
        style={{
          width: '120px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around'
        }}>
        <Spinner />
      </div>
    )
    if (context.state.loading.ProgramAdministration) {
      return commandBarButtonAs
    }
  }

  const _items: ICommandBarItemProps[] = [
    {
      key: 'newItem',
      text: strings.ProgramAddProjectButtonText,
      iconProps: { iconName: 'Add' },
      buttonStyles: { root: { border: 'none' } },
      // onClick: () => toggleProjectDialog(),
      // disabled: !isSiteAdmin
    },
    {
      key: 'delete',
      text: strings.ProgramRemoveChildButtonText,
      iconProps: { iconName: 'Delete' },
      buttonStyles: { root: { border: 'none' } },
      // disabled: selectedProjectsToDelete?.length > 0 ? false : true || !isSiteAdmin,
      onClick: (): any => {
        // deleteChildProjects(selectedProjectsToDelete, _sp)
      },
      commandBarButtonAs: getLoadingBar()
    }
  ]

  return <CommandBar items={_items} style={{ backgroundColor: 'white', marginBottom: '5px' }} />
}
