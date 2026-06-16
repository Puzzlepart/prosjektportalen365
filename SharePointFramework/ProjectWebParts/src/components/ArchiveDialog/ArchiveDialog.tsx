import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  FluentProvider,
  IdPrefixProvider,
  Label,
  Text,
  Tooltip,
  tokens
} from '@fluentui/react-components'
import {
  ArrowClockwise24Regular,
  CheckmarkCircle24Filled,
  Dismiss24Regular
} from '@fluentui/react-icons'
import { format } from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ArchiveProgress } from './ArchiveProgress'
import { ArchiveSelection } from './ArchiveSelection/ArchiveSelection'
import { SelectionSummary } from './ArchiveSelection/SelectionSummary'
import { useArchiveDialog } from './useArchiveDialog'
import { IArchiveDialogProps } from './types'
import styles from './ArchiveDialog.module.scss'

export const ArchiveDialog: FC<IArchiveDialogProps> = (props) => {
  const {
    fluentProviderId,
    documents,
    lists,
    history,
    isLoading,
    refresh,
    view,
    setView,
    config,
    setConfig,
    progress,
    showCloseConfirm,
    setShowCloseConfirm,
    selectedCount,
    resetAndClose,
    requestClose,
    handleConfirm,
    title
  } = useArchiveDialog(props)

  return (
    <>
      <Dialog
        open={props.open}
        modalType='alert'
        onOpenChange={(_, data) => !data.open && requestClose()}
      >
        <IdPrefixProvider value={fluentProviderId}>
          <FluentProvider theme={customLightTheme}>
            <DialogSurface
              style={{
                maxWidth: 'min(1210px, 95vw)',
                ...(view === 'selection' ? { minHeight: 'min(85vh, 660px)' } : {})
              }}
            >
              <DialogBody>
                <DialogTitle
                  action={
                    view !== 'archiving' && (
                      <span style={{ display: 'inline-flex', gap: 4 }}>
                        {view === 'selection' && (
                          <Tooltip
                            content={strings.ArchiveRefreshTooltip}
                            relationship='label'
                            withArrow
                          >
                            <Button
                              appearance='subtle'
                              aria-label={strings.ArchiveRefreshLabel}
                              icon={<ArrowClockwise24Regular />}
                              onClick={refresh}
                              disabled={isLoading}
                            />
                          </Tooltip>
                        )}
                        <DialogTrigger action='close' disableButtonEnhancement>
                          <Button
                            appearance='subtle'
                            aria-label={strings.CloseText}
                            icon={<Dismiss24Regular />}
                            onClick={requestClose}
                          />
                        </DialogTrigger>
                      </span>
                    )
                  }
                >
                  {title}
                </DialogTitle>
                <DialogContent>
                  {view === 'selection' && (
                    <div className={styles.archiveContent}>
                      <Label weight='semibold'>{strings.ArchiveViewDescription}</Label>
                      <ArchiveSelection
                        documents={documents}
                        lists={lists}
                        history={history}
                        isLoading={isLoading}
                        onConfigurationChange={setConfig}
                      />
                    </div>
                  )}
                  {view === 'confirm' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <SelectionSummary
                        total={selectedCount}
                        documentsSelected={config.documents?.length || 0}
                        listsSelected={config.lists?.length || 0}
                        selectedItems={[...(config.documents || []), ...(config.lists || [])]}
                      />
                      <Text weight='semibold' style={{ textAlign: 'right' }}>
                        {strings.ArchiveConfirmQuestion}
                      </Text>
                    </div>
                  )}
                  {(view === 'archiving' || view === 'completed') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {view === 'completed' && (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                          aria-live='polite'
                        >
                          <CheckmarkCircle24Filled
                            style={{ color: tokens.colorStatusSuccessForeground1 }}
                          />
                          <Text weight='semibold'>{strings.ArchiveCompletedSubText}</Text>
                        </div>
                      )}
                      <ArchiveProgress documents={progress.documents} lists={progress.lists} />
                    </div>
                  )}
                </DialogContent>
                <DialogActions>
                  {(view === 'selection' || view === 'confirm') && (
                    <Button onClick={requestClose}>{strings.CancelText}</Button>
                  )}
                  {view === 'confirm' && (
                    <Button onClick={() => setView('selection')}>
                      {strings.ArchiveBackButton}
                    </Button>
                  )}
                  {view === 'selection' && (
                    <Button
                      appearance='primary'
                      disabled={selectedCount === 0 || isLoading}
                      onClick={() => setView('confirm')}
                    >
                      {strings.ArchiveContinueText}
                    </Button>
                  )}
                  {view === 'confirm' && (
                    <Button appearance='primary' onClick={handleConfirm}>
                      {strings.Yes}
                    </Button>
                  )}
                  {view === 'completed' && (
                    <Button appearance='primary' onClick={resetAndClose}>
                      {strings.CloseText}
                    </Button>
                  )}
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </FluentProvider>
        </IdPrefixProvider>
      </Dialog>
      <Dialog open={showCloseConfirm} modalType='alert'>
        <FluentProvider theme={customLightTheme}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>{strings.ArchiveCloseConfirmTitle}</DialogTitle>
              <DialogContent>
                {format(strings.ArchiveCloseConfirmMessage, selectedCount)}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowCloseConfirm(false)}>
                  {strings.ArchiveCloseConfirmKeep}
                </Button>
                <Button appearance='primary' onClick={resetAndClose}>
                  {strings.ArchiveCloseConfirmDiscard}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </FluentProvider>
      </Dialog>
    </>
  )
}
