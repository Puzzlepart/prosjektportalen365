import * as React from 'react'
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
import { customLightTheme, getFluentIcon } from 'pp365-shared-library'
import { Commands } from './Commands'
import styles from './ProvisionSettings.module.scss'
import strings from 'PortfolioWebPartsStrings'

export const ProvisionSettings = () => {
  const {
    context,
    settings,
    columns,
    columnSizingOptions,
    defaultSortState,
    getCellFocusMode,
    fluentProviderId
  } = useProvisionSettings()

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.provisionSettingsDialog}>
        <Dialog
          modalType='modal'
          open={context.state.showProvisionSettings}
          onOpenChange={(_, data) => {
            context.setState({ showProvisionSettings: data.open })
          }}
        >
          <DialogSurface>
            <DialogBody style={{ maxHeight: 'calc(100vh - 236px)' }}>
              <DialogTitle
                action={
                  <DialogTrigger action='close'>
                    <Button appearance='subtle' title='Lukk' icon={getFluentIcon('Dismiss')} />
                  </DialogTrigger>
                }
              >
                {strings.Provision.SettingsDialogTitle}
              </DialogTitle>
              <DialogContent className={styles.content}>
                <div>{strings.Provision.SettingsDialogDescription}</div>
                {context.state.isRefetching ? (
                  <Spinner
                    size='extra-tiny'
                    label={strings.Provision.SettingsDialogSpinnerLabel}
                    style={{ padding: 10, minHeight: '20px' }}
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
                          {strings.Provision.SettingsDialogNoSearchResultsLabel}
                        </div>
                      ) : (
                        <div className={styles.message}>
                          {strings.Provision.SettingsDialogNoResultsLabel}
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
