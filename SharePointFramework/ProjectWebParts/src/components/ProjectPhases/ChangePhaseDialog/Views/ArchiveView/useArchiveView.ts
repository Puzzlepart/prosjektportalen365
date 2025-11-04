import { useContext, useEffect, useState } from 'react'
import * as strings from 'ProjectWebPartsStrings'
import { ProjectPhasesContext } from '../../../context'
import { ChangePhaseDialogContext } from '../../context'
import { SET_ARCHIVE_CONFIGURATION } from '../../reducer'
import { IArchiveSection, IArchiveConfiguration } from './types'

/**
 * Hook for managing archive view state and actions
 */
export function useArchiveView() {
  const context = useContext(ProjectPhasesContext)
  const dialogContext = useContext(ChangePhaseDialogContext)
  const [sections, setSections] = useState<IArchiveSection[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const initializeSections = () => {
      setIsLoading(true)
      try {
        const allArchiveDocuments = context.state?.data?.archiveDocuments || []
        const archiveLists = context.state?.data?.archiveLists || []
        const currentPhase = context.state?.data?.currentPhase

        let filteredDocuments = allArchiveDocuments

        if (currentPhase?.id) {
          const documentsWithCurrentPhase = allArchiveDocuments.filter(
            (doc) => doc.projectPhaseId === currentPhase.id
          )

          const documentsWithoutPhase = allArchiveDocuments.filter(
            (doc) => !doc.projectPhaseId || doc.projectPhaseId.trim() === ''
          )

          filteredDocuments = [...documentsWithoutPhase, ...documentsWithCurrentPhase]
        }

        setSections([
          {
            key: 'documents',
            title: strings.ArchiveDocumentsSection,
            expanded: true,
            items: filteredDocuments
          },
          {
            key: 'lists',
            title: strings.ArchiveListsSection,
            expanded: false,
            items: archiveLists
          }
        ])
      } catch (error) {
        console.error('Error initializing archive sections:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSections()
  }, [
    context.state?.data?.archiveDocuments,
    context.state?.data?.archiveLists,
    context.state?.data?.currentPhase
  ])

  useEffect(() => {
    const archiveConfiguration = getArchiveConfiguration()
    dialogContext.dispatch(SET_ARCHIVE_CONFIGURATION({ archiveConfiguration }))
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

  const getSelectedItemsCount = () => {
    return sections.reduce((total, section) => {
      return total + section.items.filter((item) => item.selected).length
    }, 0)
  }

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
    isLoading,
    toggleSection,
    toggleItemSelection,
    toggleSectionSelectAll,
    getSelectedItemsCount,
    getArchiveConfiguration
  }
}
