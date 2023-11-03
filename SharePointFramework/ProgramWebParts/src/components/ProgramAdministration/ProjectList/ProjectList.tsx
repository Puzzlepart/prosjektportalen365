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
import { IProjectListProps } from './types'
import { useColumns } from './useColumns'
import { SearchBox } from '@fluentui/react-search-preview'
import styles from './ProjectList.module.scss'
import strings from 'ProgramWebPartsStrings'

export const ProjectList: FC<IProjectListProps> = (props) => {
    const context = useContext(ProgramAdministrationContext)
    const columns = useColumns()
    return (
        <div className={styles.projectList}>
            <SearchBox className={styles.searchBox} placeholder={props.searchPlaceholder} />
            <DataGrid
                items={props.items}
                columns={columns}
                sortable
                resizableColumns
                containerWidthOffset={0}
                selectionMode={context.state.userHasManagePermission ? 'multiselect' : undefined}
                onSelectionChange={props.onSelectionChange}
                getRowId={({ SiteId }) => SiteId}
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
        </div>
    )
}
