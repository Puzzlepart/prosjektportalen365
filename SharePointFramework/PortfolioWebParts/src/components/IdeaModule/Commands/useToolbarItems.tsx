import { ListMenuItem } from 'pp365-shared-library'
import { useMemo } from 'react'
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
        new ListMenuItem('Ny idé', 'Opprett en ny idé').setIcon('QuizNew').setOnClick(() => {
          createNewStatusReport
        }),
        new ListMenuItem('Rediger', 'Rediger idéen').setIcon('Edit').setOnClick(() => {
          // console.log('edit')
        }),
        new ListMenuItem('Godkjenn', 'Godkjenn idéen').setIcon('CloudArrowUp').setOnClick(() => {
          decideIdea()
        })
      ].filter(Boolean),
    [context.state]
  )

  const farMenuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem('Slett', 'Slett idéen').setIcon('Delete').setOnClick(() => {
          deleteIdea()
        })
      ].filter(Boolean),
    [context.state]
  )

  return { menuItems, farMenuItems }
}
