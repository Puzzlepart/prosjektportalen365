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
  tokens,
  useId
} from '@fluentui/react-components'
import {
  ArrowClockwise24Regular,
  CheckmarkCircle24Filled,
  Dismiss24Regular
} from '@fluentui/react-icons'
import { Tooltip } from '@fluentui/react-components'
import { format } from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC, useState } from 'react'
import SPDataAdapter from '../../data'
import { ArchiveProgress, IArchiveProgressStep } from './ArchiveProgress'
import { ArchiveSelection } from './ArchiveSelection/ArchiveSelection'
import { SelectionSummary } from './ArchiveSelection/SelectionSummary'
import { IArchiveConfiguration } from './ArchiveSelection/types'
import { useArchiveDialogData } from './useArchiveDialogData'
import styles from './ArchiveDialog.module.scss'

interface IArchiveDialogProps {
  open: boolean
  webUrl: string
  onDismiss: () => void
  onArchived?: () => void
}

type View = 'selection' | 'confirm' | 'archiving' | 'completed'

interface IArchiveProgressState {
  documents: IArchiveProgressStep
  lists: IArchiveProgressStep
}

const writeArchiveLogEntries = async (
  config: IArchiveConfiguration,
  webUrl: string,
  onProgress: (next: IArchiveProgressState) => void
): Promise<void> => {
  const message = strings.ArchiveManualMessage
  const operation = strings.ArchiveLogOperationManual
  const docs = config.documents || []
  const lists = config.lists || []
  const docsTotal = docs.length
  const listsTotal = lists.length
  onProgress({
    documents: { current: 0, total: docsTotal },
    lists: { current: 0, total: listsTotal }
  })
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]
    await SPDataAdapter.logDocumentArchive(
      doc.title,
      strings.ArchiveLogStatusInProgress,
      message,
      doc.url || '',
      webUrl,
      undefined,
      doc.itemId,
      operation
    )
    onProgress({
      documents: { current: i + 1, total: docsTotal },
      lists: { current: 0, total: listsTotal }
    })
  }
  for (let i = 0; i < lists.length; i++) {
    const list = lists[i]
    await SPDataAdapter.logListArchive(
      list.title,
      strings.ArchiveLogStatusInProgress,
      message,
      list.url || '',
      webUrl,
      undefined,
      list.itemId,
      operation
    )
    onProgress({
      documents: { current: docsTotal, total: docsTotal },
      lists: { current: i + 1, total: listsTotal }
    })
  }
}

export const ArchiveDialog: FC<IArchiveDialogProps> = ({ open, webUrl, onDismiss, onArchived }) => {
  const fluentProviderId = useId('fp-archive-dialog')
  const { documents, lists, history, isLoading, refresh } = useArchiveDialogData(webUrl, open)
  const [view, setView] = useState<View>('selection')
  const [config, setConfig] = useState<IArchiveConfiguration>({ documents: [], lists: [] })
  const [progress, setProgress] = useState<IArchiveProgressState>({
    documents: { current: 0, total: 0 },
    lists: { current: 0, total: 0 }
  })
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const selectedCount = (config.documents?.length || 0) + (config.lists?.length || 0)
  const needsCloseConfirm = selectedCount > 0 && (view === 'selection' || view === 'confirm')

  const resetAndClose = () => {
    setView('selection')
    setConfig({ documents: [], lists: [] })
    setProgress({ documents: { current: 0, total: 0 }, lists: { current: 0, total: 0 } })
    setShowCloseConfirm(false)
    onDismiss()
  }

  const requestClose = () => {
    if (needsCloseConfirm) {
      setShowCloseConfirm(true)
      return
    }
    resetAndClose()
  }

  const handleConfirm = async () => {
    setView('archiving')
    try {
      await writeArchiveLogEntries(config, webUrl, setProgress)
      onArchived?.()
    } finally {
      setView('completed')
    }
  }

  const title =
    view === 'archiving'
      ? strings.ArchiveProgressTitle
      : view === 'completed'
      ? strings.ArchiveCompletedTitle
      : strings.ArchiveViewTitle

  return (
    <>
      <Dialog
        open={open}
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
