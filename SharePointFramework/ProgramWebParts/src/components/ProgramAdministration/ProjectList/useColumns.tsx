import { Link } from '@fluentui/react'
import { TableCellLayout, TableColumnDefinition } from '@fluentui/react-components'
import strings from 'ProgramWebPartsStrings'
import React from 'react'

export const useColumns = (): TableColumnDefinition<Record<string, any>>[] => {
  return [
    {
      columnId: 'title',
      compare: (a, b) => {
        return (a.Title ?? '').localeCompare(b.Title ?? '')
      },
      renderHeaderCell: () => {
        return strings.TitleLabel
      },
      renderCell: (item) => {
        return (
          <TableCellLayout truncate title={item.title}>
            <Link href={item.SPWebURL} target='_blank' title={item.Title}>
              {item.Title}
            </Link>
          </TableCellLayout>
        )
      }
    }
  ]
}