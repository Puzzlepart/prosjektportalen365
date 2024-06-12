import * as React from 'react'
import { Dismiss24Regular } from '@fluentui/react-icons'
import {
  DataGridBody,
  DataGridRow,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger
} from '@fluentui/react-components'
import { useProvisionStatus } from './useProvisionStatus'

export const ProvisionStatus = () => {
  const { context, columns, columnSizingOptions, defaultSortState, onSelection, getCellFocusMode } =
    useProvisionStatus()

  return (
    <Dialog
      modalType='modal'
      open={context.state.showProvisionStatus}
      onOpenChange={(_, data) => {
        context.setState({ showProvisionStatus: data.open })
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle
            action={
              <DialogTrigger action='close'>
                <Button appearance='subtle' title='Lukk' icon={<Dismiss24Regular />} />
              </DialogTrigger>
            }
          >
            Mine bestillinger
          </DialogTitle>
          <DialogContent>
            <p>
              Her kan du se status på dine bestillinger, hvem som er godkjenner og
              godkjenningsstatus. Dersom en bestilling blir avslått, kan du velge å bestille på nytt
              basert på en tidligere bestilling eller fjerne bestillingen fra listen.
            </p>
            <DataGrid
              items={context.state.requests}
              columns={columns}
              selectionMode='multiselect'
              selectedItems={context.state.selectedRequests}
              onSelectionChange={onSelection}
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
                    checkboxIndicator: { 'aria-label': 'Velg alle rader' }
                  }}
                >
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody>
                {({ item, rowId }) => (
                  <DataGridRow
                    key={rowId}
                    selectionCell={{
                      checkboxIndicator: { 'aria-label': 'Velg rad' }
                    }}
                  >
                    {({ renderCell, columnId }) => (
                      <DataGridCell focusMode={getCellFocusMode(columnId)}>
                        {renderCell(item)}
                      </DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
