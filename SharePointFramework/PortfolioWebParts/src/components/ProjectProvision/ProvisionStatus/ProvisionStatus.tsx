import * as React from 'react'
import {
  WrenchSettingsRegular,
  ApprovalsAppRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular
} from '@fluentui/react-icons'
import {
  PresenceBadgeStatus,
  Avatar,
  DataGridBody,
  DataGridRow,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  TableRowId,
  DataGridProps,
  Tag,
  tokens,
  Link
} from '@fluentui/react-components'

type OrderDateCell = {
  label: string
  timestamp: number
}

type StatusCell = {
  label: string
  icon: JSX.Element
  type: 'success' | 'denied' | 'configuring' | 'info'
}

type ApproverCell = {
  label: string
  status: PresenceBadgeStatus
}

type Item = {
  site: string
  orderDate: OrderDateCell
  approver: ApproverCell
  approveStatus: StatusCell
  status: StatusCell
}

const items: Item[] = [
  {
    site: 'Ny frisbee-golfbane i Grimstad',
    orderDate: { label: '7 timer siden', timestamp: 1 },
    approver: { label: 'Tarjei E. Ormestøyl', status: 'available' },
    approveStatus: {
      label: 'Avventer',
      type: 'info',
      icon: <ApprovalsAppRegular />
    },
    status: {
      label: 'Venter godkjenning',
      type: 'info',
      icon: <ApprovalsAppRegular />
    }
  },
  {
    site: 'Nytt padelsenter i Grimstad',
    orderDate: { label: 'Igår, 12:30', timestamp: 2 },
    approver: { label: 'Jan Lindset', status: 'busy' },
    approveStatus: {
      label: 'Godkjent',
      type: 'success',
      icon: <CheckmarkCircleRegular />
    },
    status: {
      label: 'Konfigurerer',
      type: 'configuring',
      icon: <WrenchSettingsRegular />
    }
  },
  {
    site: 'Ny svømmehall i Grimstad',
    orderDate: { label: 'Igår, 09:45', timestamp: 2 },
    approver: { label: 'Stian Grepperud', status: 'away' },
    approveStatus: {
      label: 'Avslått',
      type: 'denied',
      icon: <ErrorCircleRegular />
    },
    status: {
      label: 'Avsluttet',
      type: 'denied',
      icon: <ErrorCircleRegular />
    }
  },
  {
    site: 'Dampskipsbrygga i Grimstad',
    orderDate: { label: 'Tirsdag, 09:30', timestamp: 3 },
    approver: { label: 'Sindre Furulund', status: 'offline' },
    approveStatus: {
      label: 'Godkjent',
      type: 'success',
      icon: <CheckmarkCircleRegular />
    },
    status: {
      label: 'Klar til bruk',
      type: 'success',
      icon: <CheckmarkCircleRegular />
    }
  }
]

const columns: TableColumnDefinition<Item>[] = [
  createTableColumn<Item>({
    columnId: 'site',
    compare: (a, b) => {
      return a.site.localeCompare(b.site)
    },
    renderHeaderCell: () => {
      return 'Bestilling'
    },
    renderCell: (item) => {
      return (
        <TableCellLayout>
          {item.status.type === 'success' ? (
            <Link
              href='https://puzzlepart.sharepoint.com/sites/Grimstadpadelsenter-Solcelleanlegg'
              onClick={() => {
                /* close dialog */
              }}
            >
              {item.site}
            </Link>
          ) : (
            item.site
          )}
        </TableCellLayout>
      )
    }
  }),
  createTableColumn<Item>({
    columnId: 'orderDate',
    compare: (a, b) => {
      return a.orderDate.timestamp - b.orderDate.timestamp
    },
    renderHeaderCell: () => {
      return 'Dato'
    },

    renderCell: (item) => {
      return item.orderDate.label
    }
  }),
  createTableColumn<Item>({
    columnId: 'approver',
    compare: (a, b) => {
      return a.approver.label.localeCompare(b.approver.label)
    },
    renderHeaderCell: () => {
      return 'Godkjenner'
    },
    renderCell: (item) => {
      return (
        <TableCellLayout
          media={
            <Avatar
              aria-label={item.approver.label}
              name={item.approver.label}
              badge={{ status: item.approver.status }}
            />
          }
        >
          {item.approver.label}
        </TableCellLayout>
      )
    }
  }),
  createTableColumn<Item>({
    columnId: 'approveStatus',
    compare: (a, b) => {
      return a.approveStatus.label.localeCompare(b.approveStatus.label)
    },
    renderHeaderCell: () => {
      return 'Godkjenning'
    },
    renderCell: (item) => {
      return (
        <TableCellLayout>
          <Tag
            icon={item.approveStatus.icon}
            style={{
              backgroundColor:
                item.approveStatus.type === 'success'
                  ? tokens.colorStatusSuccessBackground2
                  : item.approveStatus.type === 'denied'
                  ? tokens.colorStatusDangerBackground2
                  : item.approveStatus.type === 'configuring'
                  ? tokens.colorStatusWarningBackground2
                  : tokens.colorNeutralBackground6
            }}
          >
            {item.approveStatus.label}
          </Tag>
        </TableCellLayout>
      )
    }
  }),
  createTableColumn<Item>({
    columnId: 'status',
    compare: (a, b) => {
      return a.status.label.localeCompare(b.status.label)
    },
    renderHeaderCell: () => {
      return 'Status'
    },
    renderCell: (item) => {
      return (
        <TableCellLayout>
          <Tag
            icon={item.status.icon}
            style={{
              backgroundColor:
                item.status.type === 'success'
                  ? tokens.colorStatusSuccessBackground2
                  : item.status.type === 'denied'
                  ? tokens.colorStatusDangerBackground2
                  : item.status.type === 'configuring'
                  ? tokens.colorStatusWarningBackground2
                  : tokens.colorNeutralBackground6
            }}
          >
            {item.status.label}
          </Tag>
        </TableCellLayout>
      )
    }
  })
]

export const ProvisionStatus = () => {
  const [selectedRows, setSelectedRows] = React.useState(new Set<TableRowId>([]))
  const onSelectionChange: DataGridProps['onSelectionChange'] = (e, data) => {
    setSelectedRows(data.selectedItems)
  }

  const columnSizingOptions = {
    site: {
      minWidth: 120,
      defaultWidth: 200
    },
    orderDate: {
      minWidth: 80,
      defaultWidth: 100
    },
    approver: {
      defaultWidth: 160,
      minWidth: 120,
      idealWidth: 180
    },
    approveStatus: {
      minWidth: 80,
      defaultWidth: 100
    }
  }

  const defaultSortState = React.useMemo<Parameters<NonNullable<DataGridProps['onSortChange']>>[1]>(
    () => ({ sortColumn: 'orderDate', sortDirection: 'ascending' }),
    []
  )

  return (
    <DataGrid
      items={items}
      columns={columns}
      selectionMode='multiselect'
      selectedItems={selectedRows}
      onSelectionChange={onSelectionChange}
      defaultSortState={defaultSortState}
      sortable
      resizableColumns
      columnSizingOptions={columnSizingOptions}
      resizableColumnsOptions={{
        autoFitColumns: false
      }}
    >
      <DataGridHeader>
        <DataGridRow
          selectionCell={{
            checkboxIndicator: { 'aria-label': 'Select all rows' }
          }}
        >
          {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<Item>>
        {({ item, rowId }) => (
          <DataGridRow<Item>
            key={rowId}
            selectionCell={{
              checkboxIndicator: { 'aria-label': 'Select row' }
            }}
          >
            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  )
}
