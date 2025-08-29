import { ListMenuItem } from 'pp365-shared-library'
import { useMemo } from 'react'
import * as strings from 'PortfolioWebPartsStrings'
import { useIdeaModuleContext } from '../context'
import { useCreateNewIdea } from './useCreateNewIdea'
import { useDelete } from './useDelete'
import { useDecision } from './useDecision'

/**
 * Returns an array of menu items for the toolbar in the ProjectStatus component.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems() {
  const context = useIdeaModuleContext()
  const createNewStatusReport = useCreateNewIdea()
  const deleteIdea = useDelete()
  const decideIdea = useDecision()

  // TODO: Finish the implementation of the useToolbarItems hook

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(strings.Idea.NewButtonText, strings.Idea.NewButtonDescription)
          .setIcon('QuizNew')
          .setOnClick(() => {
            createNewStatusReport
          }),
        new ListMenuItem(strings.Idea.EditButtonText, strings.Idea.EditButtonDescription)
          .setIcon('Edit')
          .setOnClick(() => {
            // Implement the edit functionality
          }),
        new ListMenuItem(strings.Idea.ApproveButtonText, strings.Idea.ApproveButtonDescription)
          .setIcon('CloudArrowUp')
          .setOnClick(() => {
            decideIdea()
          })
      ].filter(Boolean),
    [context.state]
  )

  const farMenuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(strings.Idea.DeleteButtonText, strings.Idea.DeleteButtonDescription)
          .setIcon('Delete')
          .setOnClick(() => {
            deleteIdea()
          })
      ].filter(Boolean),
    [context.state]
  )

  return { menuItems, farMenuItems }
}
