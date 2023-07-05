import { ProjectContentColumn } from 'pp365-shared-library'
import { useEffect, useState } from 'react'
import { IPortfolioAggregationContext } from '../context'

const initialColumn = new Map<string, any>([
    ['name', ''],
    ['internalName', ''],
    ['fieldName', ''],
    ['sortOrder', 100],
    ['minWidth', 100],
    ['maxWidth', 150],
    [
        'data',
        {
            renderAs: 'text'
        }
    ]
])

export function useEditableColumn(context: IPortfolioAggregationContext) {
    const [column, $setColumn] = useState<ProjectContentColumn['$map']>(initialColumn)
    const isEditing = !!context.state.columnForm.column

    useEffect(() => {
        if (isEditing) {
            const columToEdit = context.state.filteredColumns.find(
                (c) => c.key === context.state.columnForm.column.key
            )
            $setColumn(columToEdit['$map'])
        } else {
            $setColumn(initialColumn)
        }
    }, [context.state.columnForm])

    /**
     * Sets a property of the column.
     *
     * @param key Key of the column to update
     * @param value Value to update the column with
     */
    const setColumn = (key: string, value: any) => {
        $setColumn((prev) => {
            const newColumn = new Map(prev)
            newColumn.set(key, value)
            return newColumn
        })
    }

    /**
     * Set the data object of the column.
     *
     * @param key Key of the data object to update
     * @param value Value to update the data object with
     */
    const setColumnData = (key: string, value: any) => {
        $setColumn((prev) => {
            const newColumn = new Map(prev)
            const data = newColumn.get('data')
            newColumn.set('data', {
                ...data,
                [key]: value
            })
            return newColumn
        })
    }

    return {
        column,
        setColumn,
        setColumnData,
        isEditing
    } as const
}