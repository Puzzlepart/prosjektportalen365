/* eslint-disable no-console */
import React from 'react'
import { AccordionToggleEventHandler, Tooltip, useId } from '@fluentui/react-components'
import { IdeaPhase, IIdeaModuleHashState, IIdeaModuleProps } from './types'
import { useIdeaModuleState } from './useIdeaModuleState'
import { useIdeaModuleDataFetch } from './useIdeaModuleDataFetch'
import {
  DataSource,
  EditableSPField,
  ItemFieldValues,
  parseUrlHash,
  setUrlHash
} from 'pp365-shared-library'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { Hamburger } from '@fluentui/react-nav-preview'
import styles from './IdeaModule.module.scss'
import { IdeaField } from './IdeaField'

/**
 * Component logic hook for `IdeaModule` component.
 *
clear */
export function useIdeaModule(props: IIdeaModuleProps) {
  const { state, setState } = useIdeaModuleState(props)
  const fluentProviderId = useId('fp-idea-module')

  useIdeaModuleDataFetch(props, state.refetch, setState)

  console.log({ state, props })

  const getSelectedView = () => {
    const hashState = parseUrlHash()

    if (hashState.has('ideaId')) {
      return
    }

    if (state.selectedView && state.selectedView?.id === hashState.get('viewId')) {
      return
    }

    const viewIdUrlParam = new URLSearchParams(document.location.search).get('viewId')

    const views: DataSource[] = props.configuration.views
    let selectedView: DataSource = null

    if (viewIdUrlParam) {
      selectedView = _.find(views, (view) => view.id.toString() === viewIdUrlParam)
    } else if (hashState.has('viewId')) {
      selectedView = _.find(views, (view) => view.id === hashState.get('viewId'))
    } else {
      selectedView = _.first(views)
    }

    if (!selectedView) {
      state.error = 'Det ble ikke funnet noe visning...'
      return
    }

    const obj: IIdeaModuleHashState = {}
    if (selectedView) obj.viewId = selectedView.id.toString()
    setUrlHash(obj)

    setState({
      ...state,
      selectedView: selectedView,
      selectedIdea: null,
      phase: null
    })
  }

  const getSelectedIdea = () => {
    const hashState = parseUrlHash()

    if (hashState.has('viewId')) {
      return
    }

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
      phase: ideaPhase,
      selectedView: null
    })
  }

  const [openItems, setOpenItems] = useState(['registration'])
  const [isOpen, setIsOpen] = useState(true)

  const handleToggle: AccordionToggleEventHandler<string> = (event, data) => {
    setOpenItems(data.openItems)
  }

  const ignoreFields = [
    'GtIdeaRecommendation',
    'GtIdeaRecommendationComment',
    'GtIdeaDecision',
    'GtIdeaDecisionComment'
  ]

  const renderHamburger = () => {
    return (
      <Tooltip content='Navigation' relationship='label'>
        <Hamburger onClick={() => setIsOpen(!isOpen)} />
      </Tooltip>
    )
  }

  const renderStatus = () => {
    const isInProcessing = state.selectedIdea.item.processing
    const processing = state.configuration.processing
    const registration = state.configuration.registration

    const approveValue = isInProcessing
      ? processing.find((p) => p.key === 'approve')?.recommendation
      : registration.find((p) => p.key === 'approve')?.recommendation
    const considerationValue = isInProcessing
      ? processing.find((p) => p.key === 'consideration')?.recommendation
      : registration.find((p) => p.key === 'consideration')?.recommendation
    const rejectValue = isInProcessing
      ? processing.find((p) => p.key === 'reject')?.recommendation
      : registration.find((p) => p.key === 'reject')?.recommendation

    const statusStyles = {
      [approveValue]: {
        backgroundColor: 'var(--colorPaletteLightGreenBackground1)',
        borderColor: 'var(--colorPaletteLightGreenBorder1)'
      },
      [considerationValue]: {
        backgroundColor: 'var(--colorPaletteYellowBackground1)',
        borderColor: 'var(--colorPaletteYellowBorder1)'
      },
      [rejectValue]: {
        backgroundColor: 'var(--colorPaletteRedBackground1)',
        borderColor: 'var(--colorPaletteRedBorder1)'
      }
    }

    const statusValue = isInProcessing
      ? state.selectedIdea.item.processing.GtIdeaDecision
      : state.selectedIdea.item.GtIdeaRecommendation

    const backgroundColor =
      statusStyles[statusValue]?.backgroundColor || 'var(--colorNeutralBackground2)'
    const borderColor = statusStyles[statusValue]?.borderColor || 'var(--colorNeutralBackground4)'

    const fieldValues = isInProcessing
      ? state.selectedIdea.processingFieldValues
      : state.selectedIdea.registeredFieldValues

    const filterKey = isInProcessing ? 'GtIdeaDecision' : 'GtIdeaRecommendation'

    return (
      <div
        className={styles.statusSection}
        style={{ backgroundColor, border: `1px solid ${borderColor}` }}
      >
        <h2>Status</h2>
        <div className={styles.status}>
          {fieldValues
            .filter((model) => model.internalName.includes(filterKey))
            .map((model, idx) => (
              <div className={styles.field} key={idx}>
                <IdeaField key={idx} model={model} />
              </div>
            ))}
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!state.loading) {
      const hashState = parseUrlHash()

      if (hashState.has('ideaId')) {
        getSelectedIdea()
      } else {
        getSelectedView()
      }
    }
  }, [state.loading, state.selectedIdea, state.selectedView])

  return {
    state,
    setState,
    getSelectedIdea,
    getSelectedView,
    renderHamburger,
    renderStatus,
    handleToggle,
    ignoreFields,
    isOpen,
    openItems,
    fluentProviderId
  }
}
