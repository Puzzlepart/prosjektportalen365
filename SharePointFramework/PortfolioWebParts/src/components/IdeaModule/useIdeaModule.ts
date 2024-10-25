import { useId } from '@fluentui/react-components'
import { IIdeaModuleProps } from './types'
import { useIdeaModuleState } from './useIdeaModuleState'
import { useIdeaModuleDataFetch } from './useIdeaModuleDataFetch'
import { EditableSPField, ItemFieldValues } from 'pp365-shared-library'

/**
 * Component logic hook for `IdeaModule` component.
 *
clear */
export function useIdeaModule(props: IIdeaModuleProps) {
  const { state, setState } = useIdeaModuleState(props)
  const fluentProviderId = useId('fp-idea-module')

  useIdeaModuleDataFetch(props, state.refetch, setState)

  // const createProperties(state: IProjectInformationState, spfxContext: SPFxContext) {

  //   return state.data.fields
  //     .map((field) =>
  //       new EditableSPField(field)
  //         .init(state.data.columns, currentLocale, state.data.template?.fieldConfiguration)
  //         .setValue(state.data.fieldValues)
  //     )
  //     .sort((a, b) => {
  //       if (!a.column) return 1
  //       if (!b.column) return -1
  //       return a.column.sortOrder - b.column.sortOrder
  //     })
  // }

  const ideas =
    !state.loading &&
    state.ideas.data.fields
      .map((field) => {
        const fieldValues: ItemFieldValues = state.ideas.data.items[0]
        return new EditableSPField(field).setValue(fieldValues)
      })
      .sort((a, b) => {
        if (!a.column) return 1
        if (!b.column) return -1
        return a.column.sortOrder - b.column.sortOrder
      })

  return {
    state,
    setState,
    ideas,
    fluentProviderId
  }
}
