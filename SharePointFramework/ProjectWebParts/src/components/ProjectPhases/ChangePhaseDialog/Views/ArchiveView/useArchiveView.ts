import { useContext, useEffect, useState } from 'react'
import * as strings from 'ProjectWebPartsStrings'
import { ProjectPhasesContext } from '../../../context'
import { ChangePhaseDialogContext } from '../../context'
import { SET_ARCHIVE_CONFIGURATION } from '../../reducer'
import { IArchiveItem, IArchiveSection, IArchiveConfiguration } from './types'

/**
 * Hook for managing archive view state and actions
 */
export function useArchiveView() {
  const context = useContext(ProjectPhasesContext)
  const dialogContext = useContext(ChangePhaseDialogContext)
  const [sections, setSections] = useState<IArchiveSection[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize sections
  useEffect(() => {
    const initializeSections = async () => {
      setIsLoading(true)
      try {
        // Mock data - in real implementation, this would fetch from SharePoint
        // TODO: Replace with actual SharePoint API calls to get Documents and Lists
        const documentItems: IArchiveItem[] = [
          { id: 1, title: 'Project Charter.docx', type: 'file', url: '/Documents/Project Charter.docx', selected: false },
          { id: 2, title: 'Requirements.docx', type: 'file', url: '/Documents/Requirements.docx', selected: false },
          { id: 3, title: 'Specifications.pdf', type: 'file', url: '/Documents/Specifications.pdf', selected: false }
        ]

        const listItems: IArchiveItem[] = [
          { id: 'tasks', title: 'Tasks', type: 'list', url: '/Lists/Tasks', selected: false },
          { id: 'issues', title: 'Issues', type: 'list', url: '/Lists/Issues', selected: false },
          { id: 'risks', title: 'Risk Log', type: 'list', url: '/Lists/RiskLog', selected: false }
        ]

        setSections([
          {
            key: 'documents',
            title: strings.ArchiveDocumentsSection,
            expanded: true,
            items: documentItems
          },
          {
            key: 'lists',
            title: strings.ArchiveListsSection,
            expanded: false, // Collapsed by default as requested
            items: listItems
          }
        ])
      } catch (error) {
        console.error('Error initializing archive sections:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSections()
  }, [])

  // Update dialog context whenever sections change
  useEffect(() => {
    const archiveConfiguration = getArchiveConfiguration()
    dialogContext.dispatch(SET_ARCHIVE_CONFIGURATION({ archiveConfiguration }))
  }, [sections])

  const toggleSection = (sectionKey: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.key === sectionKey
          ? { ...section, expanded: !section.expanded }
          : section
      )
    )
  }

  const toggleItemSelection = (sectionKey: string, itemId: string | number) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.key === sectionKey
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? { ...item, selected: !item.selected }
                  : item
              )
            }
          : section
      )
    )
  }

  const getSelectedItemsCount = () => {
    return sections.reduce((total, section) => {
      return total + section.items.filter(item => item.selected).length
    }, 0)
  }

  const getArchiveConfiguration = (): IArchiveConfiguration => {
    const documentsSection = sections.find(s => s.key === 'documents')
    const listsSection = sections.find(s => s.key === 'lists')

    return {
      documents: documentsSection?.items.filter(item => item.selected) || [],
      lists: listsSection?.items.filter(item => item.selected) || []
    }
  }

  return {
    sections,
    isLoading,
    toggleSection,
    toggleItemSelection,
    getSelectedItemsCount,
    getArchiveConfiguration
  }
}
