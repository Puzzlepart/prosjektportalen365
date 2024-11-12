/* eslint-disable no-console */
import React from 'react'
import { Tooltip, useId } from '@fluentui/react-components'
import { IdeaPhase, IIdeaModuleHashState, IIdeaModuleProps } from './types'
import { useIdeaModuleState } from './useIdeaModuleState'
import { useIdeaModuleDataFetch } from './useIdeaModuleDataFetch'
import { EditableSPField, ItemFieldValues, parseUrlHash, setUrlHash } from 'pp365-shared-library'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { Hamburger } from '@fluentui/react-nav-preview'

/**
 * Component logic hook for `IdeaModule` component.
 *
clear */
export function useIdeaModule(props?: IIdeaModuleProps) {
  const { state, setState } = useIdeaModuleState(props)
  const fluentProviderId = useId('fp-idea-module')

  useIdeaModuleDataFetch(props, state.refetch, setState)

  const [isOpen, setIsOpen] = useState(true)

  const renderHamburger = () => {
    return (
      <Tooltip content='Navigation' relationship='label'>
        <Hamburger onClick={() => setIsOpen(!isOpen)} />
      </Tooltip>
    )
  }

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

    const registeredFieldValues = state.ideas.data.fields.registered
      .filter((field) => !props.hiddenRegFields?.includes(field.InternalName))
      .map((field) => {
        const fieldValues: ItemFieldValues = state.ideas.data.fieldValues.registered.find(
          (fv) => fv.id === selectedIdea.Id
        )
        if (!fieldValues) return null
        return new EditableSPField(field).init(state.ideas.data.columns).setValue(fieldValues)
      })
      .sort((a, b) => {
        if (!a.column) return 1
        if (!b.column) return -1
        return a.column.sortOrder - b.column.sortOrder
      })

    const processingFieldValues =
      selectedIdea.processing &&
      state.ideas.data.fields.processing
        .map((field) => {
          const fieldValues: ItemFieldValues = state.ideas.data.fieldValues.processing.find(
            (fv) => fv.get('GtRegistratedIdeaId')?.value === selectedIdea.Id
          )
          if (!fieldValues) return null
          return new EditableSPField(field).init(state.ideas.data.columns).setValue(fieldValues)
        })
        .filter((field) => !props.hiddenProcFields?.includes(field.InternalName))
        .sort((a, b) => {
          if (!a.column) return 1
          if (!b.column) return -1
          return a.column.sortOrder - b.column.sortOrder
        })

    let ideaPhase: IdeaPhase
    if (selectedIdea.processing) {
      if (
        selectedIdea.processing.GtIdeaDecision ===
        state.configuration.processing.find((p) => p.key === 'approve')?.recommendation
      ) {
        ideaPhase = IdeaPhase.ApprovedForConcept
      } else {
        ideaPhase = IdeaPhase.Processing
      }
    } else {
      if (
        selectedIdea.GtIdeaRecommendation ===
        state.configuration.registration.find((p) => p.key === 'approve')?.recommendation
      ) {
        ideaPhase = IdeaPhase.Processing
      } else {
        ideaPhase = IdeaPhase.Registration
      }
    }

    setState({
      ...state,
      selectedIdea: {
        item: selectedIdea,
        registeredFieldValues,
        processingFieldValues
      },
      phase: ideaPhase
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
    renderHamburger,
    isOpen,
    fluentProviderId
  }
}
