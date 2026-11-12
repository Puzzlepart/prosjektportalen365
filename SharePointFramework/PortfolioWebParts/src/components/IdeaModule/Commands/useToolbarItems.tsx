import { ListMenuItem } from 'pp365-shared-library'
import { useMemo } from 'react'
import * as strings from 'PortfolioWebPartsStrings'
import { useIdeaModuleContext } from '../context'
import { useCreateNewIdea } from './useCreateNewIdea'
import { useDelete } from './useDelete'
import { useDecision } from './useDecision'

/**
 * Build the idea toolbar's primary and secondary commands; actions are not implemented yet.
 */
export function useToolbarItems() {
  const context = useIdeaModuleContext()
  const createNewStatusReport = useCreateNewIdea()
  const deleteIdea = useDelete()
  const decideIdea = useDecision()

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
            // Editing remains unavailable until the idea editor is wired in.
          }),
        new ListMenuItem(strings.Idea.ApproveButtonText, strings.Idea.ApproveButtonDescription)
          .setIcon('CloudArrowUp')
          .setOnClick(() => {
            void decideIdea()
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
            void deleteIdea()
          })
      ].filter(Boolean),
    [context.state]
  )

  return { menuItems, farMenuItems }
}
