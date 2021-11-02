import React from 'react'
import { CommandBar, ICommandBarProps, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar'
import { useStore } from '../store'

export const Commandbar = () => {
    const toggleProjectDialog = useStore(state => state.toggleProjectDialog)

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
        },
    ];


    return <CommandBar items={_items} style={{ backgroundColor: "white", marginBottom: "5px" }} />
}

