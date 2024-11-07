/* eslint-disable no-console */

import { useId } from '@fluentui/react-components'
import { IIdeaModuleHashState, IIdeaModuleProps } from './types'
import { useIdeaModuleState } from './useIdeaModuleState'
import { useIdeaModuleDataFetch } from './useIdeaModuleDataFetch'
import { EditableSPField, ItemFieldValues, parseUrlHash, setUrlHash } from 'pp365-shared-library'
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

  const getSelectedIdea = () => {
    const hashState = parseUrlHash()

    if (state.selectedIdea && state.selectedIdea.item.Id === hashState.get('ideaId')) {
      return
    }

    const ideaIdUrlParam = new URLSearchParams(document.location.search).get('ideaId')
    const ideas = state.ideas.data.items
    let selectedIdea = null

    if (ideaIdUrlParam) {
      selectedIdea = _.find(ideas, (idea) => idea.Id.toString() === ideaIdUrlParam)
    } else if (hashState.has('ideaId')) {
      selectedIdea = _.find(ideas, (idea) => idea.Id === hashState.get('ideaId'))
    } else {
      selectedIdea = _.first(ideas)
    }

    if (!selectedIdea) {
      state.error = 'Det ble ikke funnet noen ideer. Opprett en ny ide for å se din idé her.'
      return
    }

    const obj: IIdeaModuleHashState = {}
    if (selectedIdea) obj.ideaId = selectedIdea.Id.toString()
    setUrlHash(obj)

    const fieldValues = state.ideas.data.fields
      .map((field) => {
        const fieldValues: ItemFieldValues = state.ideas.data.fieldValues.find(
          (fv) => fv.id === selectedIdea.Id
        )
        if (!fieldValues) return null
        return new EditableSPField(field).setValue(fieldValues)
      })
      .sort((a, b) => {
        if (!a.column) return 1
        if (!b.column) return -1
        return a.column.sortOrder - b.column.sortOrder
      })

    setState({
      ...state,
      selectedIdea: {
        item: selectedIdea,
        fieldValues: fieldValues
      }
    })
  }


  useEffect(() => {
    if (!state.loading) {
      getSelectedIdea()
    }
  }, [state.loading, state.selectedIdea])

  return {
    state,
    setState,
    getSelectedIdea,
    fluentProviderId
  }
}
