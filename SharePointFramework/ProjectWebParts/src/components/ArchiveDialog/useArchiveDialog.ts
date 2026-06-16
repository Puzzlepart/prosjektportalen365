import { useState } from 'react'
import { useId } from '@fluentui/react-components'
import * as strings from 'ProjectWebPartsStrings'
import SPDataAdapter from '../../data'
import { useArchiveDialogData } from './useArchiveDialogData'
import { IArchiveConfiguration } from './ArchiveSelection/types'
import { ArchiveDialogView, IArchiveDialogProps, IArchiveProgressState } from './types'

/**
 * Writes archive-log entries for every selected document and list, reporting
 * incremental progress (per scope) via `onProgress` as it goes.
 */
async function writeArchiveLogEntries(
  config: IArchiveConfiguration,
  webUrl: string,
  onProgress: (next: IArchiveProgressState) => void
): Promise<void> {
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

/**
 * Component logic for `ArchiveDialog`: loads archivable documents and lists,
 * tracks the wizard view + current selection, runs the archive operation with
 * progress, and gates closing behind a confirmation when there are unsaved
 * selections.
 */
export function useArchiveDialog({ open, webUrl, onDismiss, onArchived }: IArchiveDialogProps) {
  const fluentProviderId = useId('fp-archive-dialog')
  const { documents, lists, history, isLoading, refresh } = useArchiveDialogData(webUrl, open)
  const [view, setView] = useState<ArchiveDialogView>('selection')
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

  return {
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
  }
}
