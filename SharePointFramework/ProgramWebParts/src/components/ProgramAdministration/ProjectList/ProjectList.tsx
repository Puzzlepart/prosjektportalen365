import {
    DataGrid,
    DataGridBody,
    DataGridCell,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridRow
} from '@fluentui/react-components'
import React, { FC, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'
import { useColumns } from './useColumns'
import { IProjectListProps } from './types'

export const ProjectList: FC<IProjectListProps> = (props) => {
    const context = useContext(ProgramAdministrationContext)
    const columns = useColumns()
    return (
        <DataGrid
            items={props.items}
            columns={columns}
            sortable
            resizableColumns
            containerWidthOffset={0}
            selectionMode={context.state.userHasManagePermission ? 'multiselect' : undefined}
            onSelectionChange={props.onSelectionChange}
        >
            <DataGridHeader>
                <DataGridRow>
                    {({ renderHeaderCell }) => (
                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Record<string, any>>>
                {({ item, rowId }) => (
                    <DataGridRow<Record<string, any>> key={rowId}>
                        {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                    </DataGridRow>
                )}
            </DataGridBody>
        </DataGrid>
    )
}
