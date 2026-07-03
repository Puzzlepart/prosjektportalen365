import { useEffect, useRef, useState } from 'react'
import SPDataAdapter from '../../data'
import type { IArchiveItemHistory } from '../../data/SPDataAdapter/types'
import type { IArchiveItem } from './ArchiveSelection/types'

interface IArchiveDialogData {
  documents: IArchiveItem[]
  lists: IArchiveItem[]
  history: Map<string, IArchiveItemHistory>
  /** Whether the document type term set resolved with any types (drives the "Dokumenttype" column). */
  hasDocumentTypes: boolean
  isLoading: boolean
  /** Set when the (re)load failed, so the dialog can show an error + retry instead of an empty list. */
  error?: Error
  refresh: () => void
}

/**
 * Loads the documents and lists available for archiving, together with their
 * previous archive history. Fetches lazily — only when `enabled` is true (i.e.
 * while the dialog is open) — and exposes a `refresh` to re-fetch on demand.
 *
 * Opening the dialog reads through the standard 60-minute cache (fast), while
 * a user-initiated `refresh` busts the cache so documents, lists and document
 * types are always fetched fresh (archive history is never cached).
 *
 * @param webUrl - URL of the project web the archive history is read from
 * @param enabled - When false, no fetching happens (dialog closed)
 */
export function useArchiveDialogData(webUrl: string, enabled: boolean): IArchiveDialogData {
  const [documents, setDocuments] = useState<IArchiveItem[]>([])
  const [lists, setLists] = useState<IArchiveItem[]>([])
  const [history, setHistory] = useState<Map<string, IArchiveItemHistory>>(new Map())
  const [hasDocumentTypes, setHasDocumentTypes] = useState(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  // Set by `refresh()` and consumed by the next load, so only user-initiated
  // refreshes bypass the cache — not the load on (re)opening the dialog.
  const refreshCacheRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const refreshCache = refreshCacheRef.current
    refreshCacheRef.current = false
    setIsLoading(true)
    setError(undefined)
    if (refreshCache) SPDataAdapter.clearCache()
    Promise.all([
      SPDataAdapter.getDocumentsForArchive(refreshCache),
      SPDataAdapter.getListsForArchive(refreshCache),
      SPDataAdapter.getArchiveHistoryForItems(webUrl),
      SPDataAdapter.getTermFieldContext('GtDocumentType')
        .then((field) => SPDataAdapter.project.getDocumentTypes(field.termSetId, refreshCache))
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
        setHasDocumentTypes((docTypes || []).length > 0)
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [webUrl, enabled, refreshKey])

  const refresh = () => {
    refreshCacheRef.current = true
    setRefreshKey((k) => k + 1)
  }

  return { documents, lists, history, hasDocumentTypes, isLoading, error, refresh }
}
