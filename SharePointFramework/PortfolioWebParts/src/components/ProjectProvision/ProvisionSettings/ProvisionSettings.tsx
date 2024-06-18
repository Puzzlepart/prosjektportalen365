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
import { useProvisionSettings } from './useProvisionSettings'
import { customLightTheme } from 'pp365-shared-library'
import { Commands } from './Commands'
import styles from './ProvisionSettings.module.scss'

export const ProvisionSettings = (props: { toast: any }) => {
  const {
    context,
    settings,
    columns,
    columnSizingOptions,
    defaultSortState,
    getCellFocusMode,
    fluentProviderId
  } = useProvisionSettings(props.toast)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Dialog
          modalType='modal'
          open={context.state.showProvisionSettings}
          onOpenChange={(_, data) => {
            context.setState({ showProvisionSettings: data.open })
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
                Innstillinger for Bestillingsportalen
              </DialogTitle>
              <DialogContent className={styles.content}>
                <div>
                  Her har du en oversikt over alle innstillinger for Bestillingsportalen. Du kan
                  endre innstillinger ved å klikke på redigeringsknappen til høyre for hver rad.
                </div>
                {context.state.isRefetching ? (
                  <Spinner
                    size='extra-tiny'
                    label='Oppdaterer og henter innstillinger...'
                    style={{ padding: 10 }}
                  />
                ) : (
                  <Commands />
                )}
                <DataGrid
                  items={settings}
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
                  {settings.length === 0 ? (
                    <>
                      {context.state.searchTerm ? (
                        <div className={styles.message}>
                          Ingen innstillinger samsvarer med søket.
                        </div>
                      ) : (
                        <div className={styles.message}>
                          Det finnes ingen innstillinger for Bestillingsportalen.
                        </div>
                      )}
                    </>
                  ) : (
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
                  )}
                </DataGrid>
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
