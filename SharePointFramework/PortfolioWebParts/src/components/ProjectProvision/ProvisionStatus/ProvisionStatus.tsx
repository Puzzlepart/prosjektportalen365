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
  DialogTrigger,
  FluentProvider,
  IdPrefixProvider,
  Spinner
} from '@fluentui/react-components'
import { useProvisionStatus } from './useProvisionStatus'
import { customLightTheme } from 'pp365-shared-library'
import { Commands } from './Commands'
import styles from './ProvisionStatus.module.scss'

export const ProvisionStatus = (props: { toast: any }) => {
  const {
    context,
    requests,
    columns,
    columnSizingOptions,
    defaultSortState,
    getCellFocusMode,
    fluentProviderId
  } = useProvisionStatus(props.toast)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
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
              <DialogContent className={styles.content}>
                <div>
                  Her kan du se status på dine bestillinger, hvilke områdetype, status og dato for
                  bestillingen. Det er også mulig å redigere og slette bestillinger som ikke er
                  sendt inn.
                </div>
                {context.state.isRefetching ? (
                  <Spinner
                    size='extra-tiny'
                    label='Oppdaterer og henter bestillinger...'
                    style={{ padding: 10 }}
                  />
                ) : (
                  <Commands />
                )}
                <DataGrid
                  items={requests}
                  columns={columns}
                  defaultSortState={defaultSortState}
                  sortable
                  resizableColumns
                  columnSizingOptions={columnSizingOptions}
                  resizableColumnsOptions={{
                    autoFitColumns: false
                  }}
                >
                  <DataGridHeader>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  <DataGridBody>
                    {({ item, rowId }) => (
                      <DataGridRow key={rowId}>
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
      </FluentProvider>
    </IdPrefixProvider>
  )
}
