import { Link, TableCellLayout, TableColumnDefinition } from '@fluentui/react-components'
import strings from 'ProgramWebPartsStrings'
import { ProjectLogo } from 'pp365-shared-library'
import React from 'react'

export interface IListColumn extends TableColumnDefinition<Record<string, any>> {
  minWidth?: number
  defaultWidth?: number
}

export const useColumns = (renderLinks: boolean): IListColumn[] => {
  return [
    {
      columnId: 'logo',
      defaultWidth: 32,
      minWidth: 32,
      compare: () => {
        return null
      },
      renderHeaderCell: () => {
        return null
      },
      renderCell: (item) => {
        return <ProjectLogo title={item.Title} url={item.SPWebURL} renderMode='list' size='32px' />
      }
    },
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
            {renderLinks ? (
              <Link href={item.SPWebURL} target='_blank' title={item.Title}>
                {item.Title}
              </Link>
            ) : (
              item.Title
            )}
          </TableCellLayout>
        )
      }
    }
  ]
}
