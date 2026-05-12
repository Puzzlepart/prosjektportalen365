import { useEffect, useMemo, useState } from 'react'
import * as strings from 'ProjectWebPartsStrings'
import type { IArchiveItemHistory } from '../../../data/SPDataAdapter/types'
import {
  IArchiveConfiguration,
  IArchiveItem,
  IArchiveSection,
  IArchiveSelectionProps
} from './types'

const enrichWithHistory = (
  items: IArchiveItem[],
  history?: Map<string, IArchiveItemHistory>
): IArchiveItem[] => {
  if (!history || history.size === 0) return items
  return items.map((item) => {
    const previous =
      (item.itemId && history.get(item.itemId)) ||
      (item.url && history.get(item.url)) ||
      history.get(item.title)
    return previous ? { ...item, previousArchive: previous } : item
  })
}

const filterByPhase = (
  documents: IArchiveItem[],
  currentPhaseId: string | undefined
): IArchiveItem[] => {
  if (!currentPhaseId) return documents
  const matchingPhase = documents.filter((doc) => doc.projectPhaseId === currentPhaseId)
  const withoutPhase = documents.filter(
    (doc) => !doc.projectPhaseId || doc.projectPhaseId.trim() === ''
  )
  return [...withoutPhase, ...matchingPhase]
}

export function useArchiveSelection(props: IArchiveSelectionProps) {
  const { documents, lists, history, currentPhaseId, onConfigurationChange } = props

  const enrichedDocuments = useMemo(
    () => enrichWithHistory(filterByPhase(documents, currentPhaseId), history),
    [documents, currentPhaseId, history]
  )
  const enrichedLists = useMemo(() => enrichWithHistory(lists, history), [lists, history])

  const [sections, setSections] = useState<IArchiveSection[]>(() => [
    {
      key: 'documents',
      title: strings.ArchiveDocumentsSection,
      expanded: true,
      items: enrichedDocuments
    },
    {
      key: 'lists',
      title: strings.ArchiveListsSection,
      expanded: true,
      items: enrichedLists
    }
  ])

  useEffect(() => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.key === 'documents') return { ...section, items: enrichedDocuments }
        if (section.key === 'lists') return { ...section, items: enrichedLists }
        return section
      })
    )
  }, [enrichedDocuments, enrichedLists])

  useEffect(() => {
    const documentsSection = sections.find((s) => s.key === 'documents')
    const listsSection = sections.find((s) => s.key === 'lists')
    onConfigurationChange({
      documents: documentsSection?.items.filter((item) => item.selected) || [],
      lists: listsSection?.items.filter((item) => item.selected) || []
    })
  }, [sections])

  const toggleSection = (sectionKey: string) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.key === sectionKey ? { ...section, expanded: !section.expanded } : section
      )
    )
  }

  const toggleItemSelection = (sectionKey: string, itemId: string | number) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId && !item.disabled ? { ...item, selected: !item.selected } : item
              )
            }
          : section
      )
    )
  }

  const toggleSectionSelectAll = (sectionKey: string) => {
    setSections((prevSections) =>
      prevSections.map((section) => {
        if (section.key === sectionKey) {
          const enabledItems = section.items.filter((item) => !item.disabled)
          const allEnabledSelected = enabledItems.every((item) => item.selected)
          return {
            ...section,
            items: section.items.map((item) =>
              item.disabled ? item : { ...item, selected: !allEnabledSelected }
            )
          }
        }
        return section
      })
    )
  }

  const getSelectedItemsCount = () =>
    sections.reduce(
      (total, section) => total + section.items.filter((item) => item.selected).length,
      0
    )

  const getArchiveConfiguration = (): IArchiveConfiguration => {
    const documentsSection = sections.find((s) => s.key === 'documents')
    const listsSection = sections.find((s) => s.key === 'lists')
    return {
      documents: documentsSection?.items.filter((item) => item.selected) || [],
      lists: listsSection?.items.filter((item) => item.selected) || []
    }
  }

  return {
    sections,
    toggleSection,
    toggleItemSelection,
    toggleSectionSelectAll,
    getSelectedItemsCount,
    getArchiveConfiguration
  }
}
