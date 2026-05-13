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
  useId
} from '@fluentui/react-components'
import { Dismiss24Regular } from '@fluentui/react-icons'
import * as strings from 'ProjectWebPartsStrings'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC, useState } from 'react'
import SPDataAdapter from '../../data'
import { ArchiveProgress, IArchiveProgressStep } from './ArchiveProgress'
import { ArchiveSelection, SelectionSummary } from './ArchiveSelection/ArchiveSelection'
import { IArchiveConfiguration } from './ArchiveSelection/types'
import { useArchiveDialogData } from './useArchiveDialogData'
import styles from './ArchiveDialog.module.scss'

interface IArchiveDialogProps {
  open: boolean
  webUrl: string
  onDismiss: () => void
  onArchived?: () => void
}

type View = 'selection' | 'confirm' | 'archiving'

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
  const progress: IArchiveProgressState = {
    documents: { current: 0, total: docs.length },
    lists: { current: 0, total: lists.length }
  }
  onProgress(progress)
  for (const doc of docs) {
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
    progress.documents = { ...progress.documents, current: progress.documents.current + 1 }
    onProgress({ ...progress })
  }
  for (const list of lists) {
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
    progress.lists = { ...progress.lists, current: progress.lists.current + 1 }
    onProgress({ ...progress })
  }
}

export const ArchiveDialog: FC<IArchiveDialogProps> = ({ open, webUrl, onDismiss, onArchived }) => {
  const fluentProviderId = useId('fp-archive-dialog')
  const { documents, lists, history, isLoading } = useArchiveDialogData(webUrl, open)
  const [view, setView] = useState<View>('selection')
  const [config, setConfig] = useState<IArchiveConfiguration>({ documents: [], lists: [] })
  const [progress, setProgress] = useState<IArchiveProgressState>({
    documents: { current: 0, total: 0 },
    lists: { current: 0, total: 0 }
  })

  const handleDismiss = () => {
    setView('selection')
    setConfig({ documents: [], lists: [] })
    setProgress({ documents: { current: 0, total: 0 }, lists: { current: 0, total: 0 } })
    onDismiss()
  }

  const selectedCount = (config.documents?.length || 0) + (config.lists?.length || 0)

  const handleConfirm = async () => {
    setView('archiving')
    try {
      await writeArchiveLogEntries(config, webUrl, setProgress)
      onArchived?.()
    } finally {
      handleDismiss()
    }
  }

  return (
    <Dialog open={open} modalType='alert' onOpenChange={(_, data) => !data.open && handleDismiss()}>
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
                    <DialogTrigger action='close' disableButtonEnhancement>
                      <Button
                        appearance='subtle'
                        aria-label={strings.CloseText}
                        icon={<Dismiss24Regular />}
                      />
                    </DialogTrigger>
                  )
                }
              >
                {view === 'archiving' ? strings.ArchiveProgressTitle : strings.ArchiveViewTitle}
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
                {view === 'archiving' && (
                  <ArchiveProgress documents={progress.documents} lists={progress.lists} />
                )}
              </DialogContent>
              <DialogActions>
                {view !== 'archiving' && (
                  <Button onClick={handleDismiss}>{strings.CancelText}</Button>
                )}
                {view === 'confirm' && (
                  <Button onClick={() => setView('selection')}>{strings.ArchiveBackButton}</Button>
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
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </FluentProvider>
      </IdPrefixProvider>
    </Dialog>
  )
}
