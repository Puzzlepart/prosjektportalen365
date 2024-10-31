import { useId } from '@fluentui/react-components'
import { IIdeaModuleProps } from './types'
import { useIdeaModuleState } from './useIdeaModuleState'
import { useIdeaModuleDataFetch } from './useIdeaModuleDataFetch'
import { EditableSPField, ItemFieldValues, parseUrlHash } from 'pp365-shared-library'
import _ from 'lodash'
import { useEffect } from 'react'

/**
 * Component logic hook for `IdeaModule` component.
 *
clear */
export function useIdeaModule(props: IIdeaModuleProps) {
  const { state, setState } = useIdeaModuleState(props)
  const fluentProviderId = useId('fp-idea-module')

  useIdeaModuleDataFetch(props, state.refetch, setState)

  const getSelectedIdea = (hashState: Map<string, string | number>) => {
    if (state.selectedIdea) return state.selectedIdea
    const ideaIdUrlParam = new URLSearchParams(document.location.search).get('ideaId')
    const ideas = state.ideas.data.items
    let selectedIdea = null

    if (ideaIdUrlParam) {
      selectedIdea = _.find(ideas, (idea) => idea.id.toString() === ideaIdUrlParam)
      if (!selectedIdea) {
        console.log('Idea not found', ideaIdUrlParam)
      }
    } else if (hashState.has('ideaId')) {
      selectedIdea = _.find(ideas, (idea) => idea.id === hashState.get('ideaId'))
      if (!selectedIdea) {
        console.log('Idea not found', ideaIdUrlParam)
      }
    } else {
      selectedIdea = ideas[0].Id
      if (!selectedIdea) {
        console.log('Idea not found', ideaIdUrlParam)
      }
    }
    return {
      item: selectedIdea,
      fieldValues: state.ideas.data.fields
        .map((field) => {
          const fieldValues: ItemFieldValues = state.ideas.data.fieldValues.find(
            (fv) => fv.id === selectedIdea
          )
          if (!fieldValues) return null
          return new EditableSPField(field).setValue(fieldValues)
        })
        .sort((a, b) => {
          if (!a.column) return 1
          if (!b.column) return -1
          return a.column.sortOrder - b.column.sortOrder
        })
    }
  }
  const hashState = parseUrlHash()
  const selectedIdea = !state.loading && getSelectedIdea(hashState)

  return {
    state,
    setState,
    selectedIdea,
    fluentProviderId
  }
}
