import { Persona, TableCellLayout, TableColumnDefinition } from '@fluentui/react-components'
import React, { useContext } from 'react'
import { ProjectTimelineContext } from '../context'
import { get } from '@microsoft/sp-lodash-subset'
import { tryParseCurrency } from 'pp365-shared-library/lib/util/tryParseCurrency'
import moment from 'moment'
import { stringIsNullOrEmpty } from '@pnp/core'
import { getUserPhoto } from 'pp365-shared-library'

export interface IListColumn extends TableColumnDefinition<any> {
  minWidth?: number
  defaultWidth?: number
}

export const useColumns = (): IListColumn[] => {
  const context = useContext(ProjectTimelineContext)

  const renderPersona = (item) => {
    return (
      <Persona
        {...item}
        title={item.Title}
        name={item.Title}
        size='small'
        avatar={{
          image: {
            src: getUserPhoto(item.EMail)
          }
        }}
        style={{ marginTop: 6 }}
      />
    )
  }

  return context.state?.data?.listColumns.map((column) => {
    if (!column.fieldName) return null

    return {
      columnId: column.fieldName,
      defaultWidth: column.maxWidth,
      minWidth: column.minWidth,
      compare: (a, b) => {
        switch (column?.data?.type.toLowerCase()) {
          case 'number':
          case 'counter':
          case 'currency':
            return a[column.fieldName] - b[column.fieldName]
          case 'user':
          case 'lookup':
            return (a[column.fieldName]?.Title ?? '').localeCompare(
              b[column.fieldName]?.Title ?? ''
            )
          case 'date':
          case 'datetime':
            return new Date(a[column.fieldName]).getTime() - new Date(b[column.fieldName]).getTime()
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
            case 'counter':
            case 'number':
              cellValue = parseInt(value)
              break
            case 'date':
            case 'datetime':
              cellValue = moment(value).format('DD.MM.YYYY')
              break
            case 'currency':
              cellValue = tryParseCurrency(value)
              break
            case 'user':
              cellValue = renderPersona(value)
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
