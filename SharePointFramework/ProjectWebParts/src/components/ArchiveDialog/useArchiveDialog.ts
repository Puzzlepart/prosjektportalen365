import { useState } from 'react'
import { useId } from '@fluentui/react-components'
import * as strings from 'ProjectWebPartsStrings'
import SPDataAdapter from '../../data'
import { useArchiveDialogData } from './useArchiveDialogData'
import { IArchiveConfiguration } from './ArchiveSelection/types'
import { ArchiveDialogView, IArchiveDialogProps, IArchiveProgressState } from './types'

/**
 * Writes archive-log entries for every selected document and list, reporting
 * incremental progress (per scope) via `onProgress`. A failed item is counted
 * (per scope) rather than aborting the run; the resolved state's `status` is
 * `error` when anything failed, otherwise `success`.
 */
async function writeArchiveLogEntries(
  config: IArchiveConfiguration,
  webUrl: string,
  onProgress: (next: IArchiveProgressState) => void
): Promise<IArchiveProgressState> {
  const message = strings.ArchiveManualMessage
  const operation = strings.ArchiveLogOperationManual
  const docs = config.documents || []
  const lists = config.lists || []
  const state: IArchiveProgressState = {
    documents: { current: 0, total: docs.length, failed: 0 },
    lists: { current: 0, total: lists.length, failed: 0 },
    status: 'running'
  }
  const emit = () =>
    onProgress({
      documents: { ...state.documents },
      lists: { ...state.lists },
      status: state.status
    })
  emit()
  for (const doc of docs) {
    try {
      await SPDataAdapter.logDocumentArchive(
        doc.title,
        strings.ArchiveLogStatusInProgress,
        message,
        doc.url || '',
        webUrl,
        undefined,
        doc.spItemId,
        operation
      )
    } catch {
      state.documents.failed++
    }
    state.documents.current++
    emit()
  }
  for (const list of lists) {
    try {
      await SPDataAdapter.logListArchive(
        list.title,
        strings.ArchiveLogStatusInProgress,
        message,
        list.url || '',
        webUrl,
        undefined,
        list.spItemId,
        operation
      )
    } catch {
      state.lists.failed++
    }
    state.lists.current++
    emit()
  }
  state.status = state.documents.failed + state.lists.failed > 0 ? 'error' : 'success'
  emit()
  return state
}

/**
 * Component logic for `ArchiveDialog`: loads archivable documents and lists,
 * tracks the wizard view + current selection, runs the archive operation with
 * progress, and gates closing behind a confirmation when there are unsaved
 * selections.
 */
export function useArchiveDialog({ open, webUrl, onDismiss, onArchived }: IArchiveDialogProps) {
  const fluentProviderId = useId('fp-archive-dialog')
  const { documents, lists, history, isLoading, error, refresh } = useArchiveDialogData(webUrl, open)
  const [view, setView] = useState<ArchiveDialogView>('selection')
  const [config, setConfig] = useState<IArchiveConfiguration>({ documents: [], lists: [] })
  const emptyProgress: IArchiveProgressState = {
    documents: { current: 0, total: 0, failed: 0 },
    lists: { current: 0, total: 0, failed: 0 },
    status: 'running'
  }
  const [progress, setProgress] = useState<IArchiveProgressState>(emptyProgress)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const selectedCount = (config.documents?.length || 0) + (config.lists?.length || 0)
  const needsCloseConfirm = selectedCount > 0 && (view === 'selection' || view === 'confirm')

  const resetAndClose = () => {
    setView('selection')
    setConfig({ documents: [], lists: [] })
    setProgress(emptyProgress)
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
      // Refresh status regardless — a partial run still wrote some rows.
      onArchived?.()
    } catch {
      setProgress((prev) => ({ ...prev, status: 'error' }))
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
    error,
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
