import React, { FunctionComponent } from 'react'
import { CommandBar, ICommandBarProps, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar'
import { useStore } from '../store'
import { removeChildProject } from '../helpers'
import { SPRest } from '@pnp/sp'
import { fetchChildProjects } from '../helpers'


interface commandBarProps {
    _sp: SPRest
}

export const Commandbar: FunctionComponent<commandBarProps> = ({ _sp }) => {
    const toggleProjectDialog = useStore(state => state.toggleProjectDialog)
    const selectedProjectsToDelete = useStore(state => state.selectedProjectsToDelete)
    const setChildProjects = useStore(state => state.setChildProjects)

    const _items: ICommandBarItemProps[] = [
        {
            key: 'newItem',
            text: 'Legg til prosjekt',
            iconProps: { iconName: 'Add' },
            buttonStyles: { root: { border: 'none' } },
            onClick: () => toggleProjectDialog()
        },
        {
            key: 'delete',
            text: 'Fjern underordnet prosjekt',
            iconProps: { iconName: 'Delete' },
            buttonStyles: { root: { border: 'none' } },
            disabled: selectedProjectsToDelete == null,
            onClick: (): any => {
                removeChildProject(_sp, selectedProjectsToDelete).then(async () => setChildProjects(await fetchChildProjects(_sp)))

            }
        },
    ];

    return <CommandBar items={_items} style={{ backgroundColor: "white", marginBottom: "5px" }} />
}

