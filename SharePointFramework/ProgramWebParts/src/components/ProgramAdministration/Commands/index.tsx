import React, { FunctionComponent } from 'react'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar'
import { useStore } from '../store'
import { SPRest } from '@pnp/sp'
import * as strings from 'ProgramWebPartsStrings'
import { Spinner } from 'office-ui-fabric-react'


interface commandBarProps {
    _sp: SPRest
}

export const Commandbar: FunctionComponent<commandBarProps> = ({ _sp }) => {
    const toggleProjectDialog = useStore(state => state.toggleProjectDialog)
    const deleteChildProjects = useStore(state => state.deleteChildProjects)
    const selectedProjectsToDelete = useStore(state => state.selectedProjectsToDelete)
    const isLoading = useStore(state => state.isLoading)

    const _items: ICommandBarItemProps[] = isLoading ? [
        {
            key: 'newItem',
            text: strings.ProgramAddProjectButtonText,
            iconProps: { iconName: 'Add' },
            buttonStyles: { root: { border: 'none' } },
            onClick: () => toggleProjectDialog()
        },
        {
            key: 'delete',
            text: strings.ProgramRemoveChildButtonText,
            iconProps: { iconName: 'Delete' },
            buttonStyles: { root: { border: 'none' } },
            disabled: selectedProjectsToDelete == null,
            onClick: (): any => {
                deleteChildProjects(selectedProjectsToDelete, _sp)
            },
            commandBarButtonAs: () => <Spinner />
        
        },
    ] : [
        {
            key: 'newItem',
            text: strings.ProgramAddProjectButtonText,
            iconProps: { iconName: 'Add' },
            buttonStyles: { root: { border: 'none' } },
            onClick: () => toggleProjectDialog()
        },
        {
            key: 'delete',
            text: strings.ProgramRemoveChildButtonText,
            iconProps: { iconName: 'Delete' },
            buttonStyles: { root: { border: 'none' } },
            disabled: selectedProjectsToDelete == null,
            onClick: (): any => {
                deleteChildProjects(selectedProjectsToDelete, _sp)
            }
        
        }
    ]

    return <CommandBar items={_items} style={{ backgroundColor: "white", marginBottom: "5px" }} />
}

