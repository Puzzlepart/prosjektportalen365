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
  Avatar,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tooltip,
  Link
} from '@fluentui/react-components'
import { useContext } from 'react'
import { ListContext } from './context'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import styles from './List.module.scss'
import { CalendarMonthRegular } from '@fluentui/react-icons'

export const List = () => {
  const context = useContext(ListContext)
  const refMap = React.useRef<Record<string, HTMLElement | null>>({})

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
            const [showCustomImage, setShowCustomImage] = React.useState(true)

            return (
              <div
                className={styles.logo}
                style={{ height: context.size !== 'medium' ? '32px' : '48px' }}
              >
                <Avatar
                  className={styles.projectAvatar}
                  aria-label={`Logo for project: ${item.title}'`}
                  title={`Logo for project: ${item.title}'`}
                  color={'colorful'}
                  shape={'square'}
                  style={{ display: showCustomImage ? 'none' : 'block' }}
                  name={item.title?.slice(-2).toUpperCase()}
                  initials={item.title?.slice(0, 2).toUpperCase()}
                />
                <img
                  src={item.logo ?? `${item.url}/_api/siteiconmanager/getsitelogo?type='1'`}
                  style={{
                    display: !showCustomImage ? 'none' : 'block'
                  }}
                  alt={`Logo for project: ${item.title}'`}
                  onLoad={(image) => {
                    setShowCustomImage(
                      (image.target as HTMLImageElement).naturalHeight !== 648
                        ? (image.target as HTMLImageElement).naturalHeight !== 96
                          ? true
                          : false
                        : false
                    )
                  }}
                />
              </div>
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
              <TableCellLayout truncate>
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
              <TableCellLayout truncate>
                {item.hasUserAccess ? (
                  <a href={item.url} target={'_blank'} rel='noreferrer'>
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
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <Tooltip content={'Hurtigmeny for prosjekt'} relationship={'label'}>
                    <MenuButton
                      icon={<CalendarMonthRegular />}
                      size={context.size !== 'medium' ? 'small' : 'medium'}
                    />
                  </Tooltip>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem>
                      <Link href={`${item.url}/SitePages/Prosjektstatus.aspx`}>Prosjektstatus</Link>
                    </MenuItem>
                    <MenuItem>
                      <Link href={`${item.url}/Delte%20dokumenter`}>Dokumentbibliotek</Link>
                    </MenuItem>
                    <MenuItem>
                      <Link href={`${item.url}/Lists/Fasesjekkliste`}>Fasesjekkliste</Link>
                    </MenuItem>
                    <MenuItem>
                      <Link href={`${item.url}/SitePages/Oppgaver.aspx`}>Oppgaver</Link>
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
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
            return <TableCellLayout truncate>{item[col.fieldName] || ''}</TableCellLayout>
          }
        }
    }
  })

  const columnSizingOptions = context.columns.reduce(
    (options, col) => (
      (options[col.fieldName] = {
        minWidth: col.minWidth,
        defaultWidth: 120,
        idealWidth: col.idealWidth
      }),
      options
    ),
    {}
  )

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
