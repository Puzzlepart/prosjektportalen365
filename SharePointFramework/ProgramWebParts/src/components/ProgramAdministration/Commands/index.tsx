import React, { FunctionComponent } from 'react'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar'
import { useStore } from '../store'
import { SPRest } from '@pnp/sp'
import * as strings from 'ProgramWebPartsStrings'


interface commandBarProps {
    _sp: SPRest
}

export const Commandbar: FunctionComponent<commandBarProps> = ({ _sp }) => {
    const toggleProjectDialog = useStore(state => state.toggleProjectDialog)
    const selectedProjectsToDelete = useStore(state => state.selectedProjectsToDelete)
    const deleteChildProjects = useStore(state => state.deleteChildProjects)

    const _items: ICommandBarItemProps[] = [
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
        },
    ];

    return <CommandBar items={_items} style={{ backgroundColor: "white", marginBottom: "5px" }} />
}

