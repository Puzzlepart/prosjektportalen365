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
import { useProvisionStatus } from './useProvisionStatus'
import { customLightTheme, getFluentIcon } from 'pp365-shared-library'
import { Commands } from './Commands'
import styles from './ProvisionStatus.module.scss'
import strings from 'PortfolioWebPartsStrings'

export interface IProvisionStatusProps {
  toast: any
  renderMode?: 'button' | 'inline'
  onBack?: () => void
}

export const ProvisionStatus = (props: IProvisionStatusProps) => {
  const {
    context,
    requests,
    columns,
    columnSizingOptions,
    defaultSortState,
    getCellFocusMode,
    fluentProviderId
  } = useProvisionStatus(props.toast)

  const isInlineMode = props.renderMode === 'inline'

  const gridContent = (
    <>
      <div>{strings.Provision.StatusDialogDescription}</div>
      {context.state.isRefetching ? (
        <Spinner
          size='extra-tiny'
          label={strings.Provision.StatusDialogSpinnerLabel}
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
        {requests.length === 0 ? (
          <>
            {context.state.searchTerm ? (
              <div className={styles.message}>
                {strings.Provision.StatusDialogNoSearchResultsLabel}
              </div>
            ) : (
              <div className={styles.message}>
                {strings.Provision.StatusDialogNoResultsLabel}
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
    </>
  )

  if (isInlineMode) {
    return (
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <div className={styles.inlineContainer}>
            <div className={styles.header}>
              {props.onBack && (
                <Button
                  appearance='subtle'
                  icon={getFluentIcon('ArrowLeft')}
                  onClick={props.onBack}
                  className={styles.backButton}
                >
                  {strings.Provision.PreviousButtonLabel}
                </Button>
              )}
              <h2 className={styles.title}>{strings.Provision.StatusDialogTitle}</h2>
            </div>
            <div className={styles.content}>
              {gridContent}
            </div>
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    )
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.provisionStatusDialog}>
        <Dialog
          modalType='modal'
          open={context.state.showProvisionStatus}
          onOpenChange={(_, data) => {
            context.setState({ showProvisionStatus: data.open })
          }}
        >
          <DialogSurface>
            <DialogBody style={{ maxHeight: 'calc(100vh - 236px)' }}>
              <DialogTitle
                action={
                  <DialogTrigger action='close'>
                    <Button
                      appearance='subtle'
                      title={strings.Aria.Close}
                      icon={getFluentIcon('Dismiss')}
                    />
                  </DialogTrigger>
                }
              >
                {strings.Provision.StatusDialogTitle}
              </DialogTitle>
              <DialogContent className={styles.content}>
                {gridContent}
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
