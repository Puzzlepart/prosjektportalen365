import { useEffect, useState } from 'react'
import SPDataAdapter from '../../data'
import type { IArchiveItemHistory } from '../../data/SPDataAdapter/types'
import type { IArchiveItem } from './ArchiveSelection/types'

interface IArchiveDialogData {
  documents: IArchiveItem[]
  lists: IArchiveItem[]
  history: Map<string, IArchiveItemHistory>
  isLoading: boolean
  refresh: () => void
}

/**
 * Loads the documents and lists available for archiving, together with their
 * previous archive history. Fetches lazily — only when `enabled` is true (i.e.
 * while the dialog is open) — and exposes a `refresh` to re-fetch on demand.
 *
 * @param webUrl - URL of the project web the archive history is read from
 * @param enabled - When false, no fetching happens (dialog closed)
 */
export function useArchiveDialogData(webUrl: string, enabled: boolean): IArchiveDialogData {
  const [documents, setDocuments] = useState<IArchiveItem[]>([])
  const [lists, setLists] = useState<IArchiveItem[]>([])
  const [history, setHistory] = useState<Map<string, IArchiveItemHistory>>(new Map())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setIsLoading(true)
    SPDataAdapter.clearCache()
    Promise.all([
      SPDataAdapter.getDocumentsForArchive(),
      SPDataAdapter.getListsForArchive(),
      SPDataAdapter.getArchiveHistoryForItems(webUrl),
      SPDataAdapter.getTermFieldContext('GtDocumentType')
        .then((field) => SPDataAdapter.project.getDocumentTypes(field.termSetId))
        .catch(() => [])
    ])
      .then(([docs, listsData, historyData, docTypes]) => {
        if (cancelled) return
        const archiveableTypeIds = new Set(
          (docTypes || []).filter((t: any) => t.isArchiveable).map((t: any) => t.id)
        )
        const docTypeNameById = new Map<string, string>(
          (docTypes || []).map((t: any) => [t.id as string, t.name as string])
        )
        setDocuments(
          docs.map<IArchiveItem>((doc) => ({
            ...doc,
            documentTypeName: docTypeNameById.get(doc.documentTypeId),
            selected: false,
            disabled:
              archiveableTypeIds.size > 0 ? !archiveableTypeIds.has(doc.documentTypeId) : false
          }))
        )
        setLists(
          listsData.map<IArchiveItem>((list) => ({
            ...list,
            selected: false,
            disabled: list.itemCount === 0
          }))
        )
        setHistory(historyData)
        setIsLoading(false)
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [webUrl, enabled, refreshKey])

  const refresh = () => setRefreshKey((k) => k + 1)

  return { documents, lists, history, isLoading, refresh }
}
