import * as React from 'react'
import {
  DataGridBody,
  DataGridRow,
  DataGrid,
  DataGridProps,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  TableColumnDefinition,
  TableCellLayout,
  Avatar
} from '@fluentui/react-components'
import { useContext } from 'react'
import { ListContext } from './context'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import styles from './List.module.scss'
import { ProjectLogo } from 'pp365-shared-library/lib/components'
import { useList } from './useList'
import strings from 'PortfolioWebPartsStrings'
import { ProjectMenu } from '../ProjectMenu'

export const List = () => {
  const context = useContext(ListContext)
  const { refMap, columnSizingOptions } = useList()

  const columns: TableColumnDefinition<ProjectListModel>[] = context.columns.map((col) => {
    switch (col.fieldName) {
      case 'logo':
        return {
          columnId: col.fieldName,
          compare: () => {
            return
          },
          renderHeaderCell: () => {
            return
          },
          renderCell: (item) => {
            return (
              <ProjectLogo
                title={item.title}
                url={item.url}
                renderMode='list'
                size={context.size !== 'medium' ? '32px' : '48px'}
              />
            )
          }
        }
      case 'owner':
      case 'manager':
        return {
          columnId: col.fieldName,
          compare: (a, b) => {
            return (a[col.fieldName]?.name || '').localeCompare(b[col.fieldName]?.name || '')
          },
          renderHeaderCell: () => {
            return col.name
          },
          renderCell: (item) => {
            return (
              <TableCellLayout
                truncate
                title={`${col.name}: ${item[col.fieldName]?.name || strings.NotSet}`}
              >
                <Avatar
                  className={styles.avatar}
                  size={context.size !== 'medium' ? 24 : 32}
                  {...item[col.fieldName]}
                />{' '}
                {item[col.fieldName]?.name}
              </TableCellLayout>
            )
          }
        }
      case 'title':
        return {
          columnId: col.fieldName,
          compare: (a, b) => {
            return (a[col.fieldName] || '').localeCompare(b[col.fieldName] || '')
          },
          renderHeaderCell: () => {
            return col.name
          },
          renderCell: (item) => {
            return (
              <TableCellLayout truncate title={item[col.fieldName]}>
                {item.hasUserAccess ? (
                  <a href={item.url} target='_blank' rel='noreferrer'>
                    {item[col.fieldName]}
                  </a>
                ) : (
                  <>{item[col.fieldName]}</>
                )}
              </TableCellLayout>
            )
          }
        }
      case 'action':
        return {
          columnId: 'actions',
          compare: () => {
            return
          },
          renderHeaderCell: () => {
            return ''
          },
          renderCell: (item) => {
            return (
              <ProjectMenu
                project={item}
                context={context}
                size={context.size !== 'medium' ? 'small' : 'medium'}
              />
            )
          }
        }
      default:
        return {
          columnId: col.fieldName,
          compare: (a, b) => {
            return (a[col.fieldName] || '').localeCompare(b[col.fieldName] || '')
          },
          renderHeaderCell: () => {
            return col.name
          },
          renderCell: (item) => {
            return (
              <TableCellLayout truncate title={item[col.fieldName]}>
                {item[col.fieldName] || ''}
              </TableCellLayout>
            )
          }
        }
    }
  })

  const defaultSortState = React.useMemo<Parameters<NonNullable<DataGridProps['onSortChange']>>[1]>(
    () => ({ sortColumn: 'title', sortDirection: 'ascending' }),
    []
  )

  return (
    <div className={styles.list}>
      <DataGrid
        items={context.projects}
        columns={columns}
        sortable
        defaultSortState={defaultSortState}
        resizableColumns
        columnSizingOptions={columnSizingOptions}
        containerWidthOffset={0}
        size={context.size}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell, columnId }) => (
              <DataGridHeaderCell ref={(el) => (refMap.current[columnId] = el)}>
                {renderHeaderCell()}
              </DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<ProjectListModel>>
          {({ item, rowId }) => (
            <DataGridRow<ProjectListModel> key={rowId}>
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  )
}
