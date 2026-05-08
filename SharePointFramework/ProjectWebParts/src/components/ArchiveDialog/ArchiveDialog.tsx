import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  FluentProvider,
  IdPrefixProvider,
  Label,
  Spinner,
  useId
} from '@fluentui/react-components'
import { format } from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC, useState } from 'react'
import SPDataAdapter from '../../data'
import { ArchiveSelection } from './ArchiveSelection/ArchiveSelection'
import { IArchiveConfiguration } from './ArchiveSelection/types'
import { useArchiveDialogData } from './useArchiveDialogData'

interface IArchiveDialogProps {
  open: boolean
  webUrl: string
  onDismiss: () => void
  onArchived?: () => void
}

type View = 'selection' | 'confirm' | 'archiving'

const writeArchiveLogEntries = async (
  config: IArchiveConfiguration,
  webUrl: string
): Promise<void> => {
  const message = strings.ArchiveManualMessage
  const operation = strings.ArchiveLogOperationManual
  for (const doc of config.documents || []) {
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
  }
  for (const list of config.lists || []) {
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
  }
}

export const ArchiveDialog: FC<IArchiveDialogProps> = ({ open, webUrl, onDismiss, onArchived }) => {
  const fluentProviderId = useId('fp-archive-dialog')
  const { documents, lists, history, isLoading } = useArchiveDialogData(webUrl, open)
  const [view, setView] = useState<View>('selection')
  const [config, setConfig] = useState<IArchiveConfiguration>({ documents: [], lists: [] })

  const handleDismiss = () => {
    setView('selection')
    setConfig({ documents: [], lists: [] })
    onDismiss()
  }

  const selectedCount = (config.documents?.length || 0) + (config.lists?.length || 0)

  const handleConfirm = async () => {
    setView('archiving')
    try {
      await writeArchiveLogEntries(config, webUrl)
      onArchived?.()
    } finally {
      handleDismiss()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && handleDismiss()}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>
                {view === 'archiving' ? strings.ArchiveLoadingText : strings.ArchiveViewTitle}
              </DialogTitle>
              <DialogContent>
                {view === 'selection' && (
                  <>
                    <Label weight='semibold'>{strings.ArchiveViewDescription}</Label>
                    <ArchiveSelection
                      documents={documents}
                      lists={lists}
                      history={history}
                      isLoading={isLoading}
                      onConfigurationChange={setConfig}
                    />
                  </>
                )}
                {view === 'confirm' && (
                  <Label>{format(strings.ArchiveSelectedItemsInfo, selectedCount)}</Label>
                )}
                {view === 'archiving' && <Spinner label={strings.ArchiveLoadingText} />}
              </DialogContent>
              <DialogActions>
                {view !== 'archiving' && (
                  <Button onClick={handleDismiss}>{strings.CancelText}</Button>
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
