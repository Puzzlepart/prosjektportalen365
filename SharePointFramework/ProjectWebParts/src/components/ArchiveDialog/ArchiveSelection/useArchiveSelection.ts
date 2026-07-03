import { useEffect, useMemo, useState } from 'react'
import * as strings from 'ProjectWebPartsStrings'
import type { IArchiveItemHistory } from '../../../data/SPDataAdapter/types'
import {
  IArchiveDocumentFilters,
  IArchiveItem,
  IArchiveSection,
  IArchiveSelectionProps
} from './types'

type ItemId = string | number

/** Attaches the most recent archive-history entry to each item (matched by stable id, then url, then title). */
function enrichWithHistory(
  items: IArchiveItem[],
  history?: Map<string, IArchiveItemHistory>
): IArchiveItem[] {
  if (!history || history.size === 0) return items
  return items.map((item) => {
    const previous =
      (item.spItemId && history.get(item.spItemId)) ||
      (item.url && history.get(item.url)) ||
      history.get(item.title)
    return previous ? { ...item, previousArchive: previous } : item
  })
}

/** Restricts documents to the current phase (plus phase-less documents); no-op when no phase is given. */
function filterByPhase(
  documents: IArchiveItem[],
  currentPhaseId: string | undefined
): IArchiveItem[] {
  if (!currentPhaseId) return documents
  const matchingPhase = documents.filter((doc) => doc.projectPhaseId === currentPhaseId)
  const withoutPhase = documents.filter(
    (doc) => !doc.projectPhaseId || doc.projectPhaseId.trim() === ''
  )
  return [...withoutPhase, ...matchingPhase]
}

/** Marks each item selected/unselected from the current selection set. */
function applySelection(items: IArchiveItem[], selectedIds: Set<ItemId>): IArchiveItem[] {
  return items.map((item) => ({ ...item, selected: selectedIds.has(item.id) }))
}

/** Builds a section descriptor (counts + all/some-selected flags) from its items. */
function buildSection(key: string, title: string, items: IArchiveItem[]): IArchiveSection {
  const selectedCount = items.filter((item) => item.selected).length
  const enabled = items.filter((item) => !item.disabled)
  const allSelected = enabled.length > 0 && enabled.every((item) => item.selected)
  return {
    key,
    title,
    items,
    selectedCount,
    allSelected,
    someSelected: selectedCount > 0 && !allSelected
  }
}

/**
 * Selection logic for {@link ArchiveSelection}: tracks which items are selected,
 * derives the documents/lists sections (history-enriched, phase-filtered), and
 * reports the chosen configuration up via `onConfigurationChange`.
 *
 * `documentFilters` (search + document type) only narrows what the documents
 * section *shows* — and what its select-all toggles — while the emitted
 * configuration always includes every selected item, filtered out of view or not.
 */
export function useArchiveSelection(
  props: IArchiveSelectionProps,
  documentFilters?: IArchiveDocumentFilters
) {
  const { documents, lists, history, currentPhaseId, onConfigurationChange } = props
  const [selectedIds, setSelectedIds] = useState<Set<ItemId>>(new Set())

  const documentsSectionItems = useMemo(
    () =>
      applySelection(
        enrichWithHistory(filterByPhase(documents, currentPhaseId), history),
        selectedIds
      ),
    [documents, currentPhaseId, history, selectedIds]
  )
  const listsSectionItems = useMemo(
    () => applySelection(enrichWithHistory(lists, history), selectedIds),
    [lists, history, selectedIds]
  )

  const searchTerm = (documentFilters?.searchTerm ?? '').trim().toLowerCase()
  const documentTypeIds = documentFilters?.documentTypeIds ?? []
  const visibleDocumentsItems = useMemo(
    () =>
      documentsSectionItems.filter((item) => {
        if (
          searchTerm &&
          !item.title.toLowerCase().includes(searchTerm) &&
          !(item.documentTypeName ?? '').toLowerCase().includes(searchTerm)
        ) {
          return false
        }
        if (documentTypeIds.length > 0 && !documentTypeIds.includes(item.documentTypeId)) {
          return false
        }
        return true
      }),
    [documentsSectionItems, searchTerm, documentTypeIds.join('|')]
  )

  const sections: IArchiveSection[] = useMemo(
    () => [
      buildSection('documents', strings.ArchiveDocumentsSection, visibleDocumentsItems),
      buildSection('lists', strings.ArchiveListsSection, listsSectionItems)
    ],
    [visibleDocumentsItems, listsSectionItems]
  )

  useEffect(() => {
    onConfigurationChange({
      documents: documentsSectionItems.filter((item) => item.selected),
      lists: listsSectionItems.filter((item) => item.selected)
    })
  }, [documentsSectionItems, listsSectionItems])

  const toggleItemSelection = (sectionKey: string, itemId: ItemId) => {
    const items = sectionKey === 'documents' ? documentsSectionItems : listsSectionItems
    const item = items.find((i) => i.id === itemId)
    if (item?.disabled) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const toggleSectionSelectAll = (sectionKey: string) => {
    // Select-all only operates on the rows the user can currently see.
    const items = sectionKey === 'documents' ? visibleDocumentsItems : listsSectionItems
    const enabled = items.filter((i) => !i.disabled)
    if (enabled.length === 0) return
    const allSelected = enabled.every((i) => i.selected)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      enabled.forEach((item) => {
        if (allSelected) next.delete(item.id)
        else next.add(item.id)
      })
      return next
    })
  }

  return { sections, toggleItemSelection, toggleSectionSelectAll }
}
