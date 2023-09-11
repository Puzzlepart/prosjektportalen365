import { TableCellLayout, TableColumnDefinition } from '@fluentui/react-components'
import React, { useContext } from 'react'
import { ProjectTimelineContext } from '../context'
import { get } from '@microsoft/sp-lodash-subset'
import { tryParseCurrency } from 'pp365-shared-library/lib/util/tryParseCurrency'
import moment from 'moment'
import { stringIsNullOrEmpty } from '@pnp/core'

export interface IListColumn extends TableColumnDefinition<any> {
  minWidth?: number
  defaultWidth?: number
}

export const useColumns = (): IListColumn[] => {
  const context = useContext(ProjectTimelineContext)

  return context.state?.data?.listColumns.map((column) => {
    if (!column.fieldName) return null

    return {
      columnId: column.fieldName,
      defaultWidth: column.maxWidth,
      minWidth: column.minWidth,
      compare: (a, b) => {
        switch (column?.data?.type.toLowerCase()) {
          case 'counter':
          case 'int':
            return (a[column.fieldName] ?? '').localeCompare(b[column.fieldName] ?? '', undefined, {
              numeric: true
            })
          case 'lookup':
            return (a[column.fieldName]?.Title ?? '').localeCompare(
              b[column.fieldName]?.Title ?? ''
            )
          default:
            return (a[column.fieldName] ?? '').localeCompare(b[column.fieldName] ?? '')
        }
      },
      renderHeaderCell: () => {
        return column.name
      },
      renderCell: (item) => {
        const value = get(item, column.fieldName, null)
        let cellValue

        if (!stringIsNullOrEmpty(value)) {
          switch (column?.data?.type.toLowerCase()) {
            case 'int':
              cellValue = parseInt(value)
              break
            case 'date':
              cellValue = moment(value).format('DD.MM.YYYY')
              break
            case 'datetime':
              cellValue = moment(value).format('DD.MM.YYYY')
              break
            case 'currency':
              cellValue = tryParseCurrency(value)
              break
            case 'lookup':
              cellValue = value.Title
              break
            default:
              cellValue = value
              break
          }
        }

        return (
          <TableCellLayout truncate title={cellValue}>
            <>{cellValue}</>
          </TableCellLayout>
        )
      }
    }
  })
}
