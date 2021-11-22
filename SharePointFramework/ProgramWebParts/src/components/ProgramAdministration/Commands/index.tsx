import React, { FunctionComponent } from 'react'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar'
import { useStore } from '../store'
import { SPRest } from '@pnp/sp'
import * as strings from 'ProgramWebPartsStrings'
import { Spinner, ProgressIndicator } from 'office-ui-fabric-react'



interface commandBarProps {
    _sp: SPRest
}

export const Commandbar: FunctionComponent<commandBarProps> = ({ _sp }) => {
    const toggleProjectDialog = useStore(state => state.toggleProjectDialog)
    const deleteChildProjects = useStore(state => state.deleteChildProjects)
    const selectedProjectsToDelete = useStore(state => state.selectedProjectsToDelete)
    const isLoading = useStore(state => state.isLoading)


    const getLoadingBar = () => {
        const commandBarButtonAs = () => <div style={{ width: '120px', display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}><Spinner /></div>
        if (isLoading) {
            return commandBarButtonAs
        }
    }


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
            disabled: selectedProjectsToDelete?.length > 0 ? false : true,
            onClick: (): any => {
                deleteChildProjects(selectedProjectsToDelete, _sp)
            },
            commandBarButtonAs: getLoadingBar()
        }
    ]

    return <CommandBar items={_items} style={{ backgroundColor: "white", marginBottom: "5px" }} />
}

