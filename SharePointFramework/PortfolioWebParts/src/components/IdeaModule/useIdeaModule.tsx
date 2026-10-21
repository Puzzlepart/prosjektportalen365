import React from 'react'
import { AccordionToggleEventHandler, Tooltip, useId, Hamburger } from '@fluentui/react-components'
import * as strings from 'PortfolioWebPartsStrings'
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
import { RefObject, useEffect, useRef, useState } from 'react'
import styles from './IdeaModule.module.scss'
import { IdeaField } from './IdeaField'

/** The screens on which the menu leaves the ideas no room beside it. */
export const NARROW_SCREEN_QUERY = '(max-width: 480px)'

/**
 * Whether the screen is narrow (`NARROW_SCREEN_QUERY`).
 */
function isNarrowScreen() {
  return !!window.matchMedia?.(NARROW_SCREEN_QUERY).matches
}

/**
 * Component logic hook for `IdeaModule` component.
 *
 */
export function useIdeaModule(props: IIdeaModuleProps) {
  const { state, setState } = useIdeaModuleState(props)
  const fluentProviderId = useId('fp-idea-module')

  useIdeaModuleDataFetch(props, state.refetch, setState)

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
      setState({
        error: {
          title: strings.NoViewFoundTitle,
          message: strings.Idea.NoViewFoundErrorMessage
        }
      })
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
      setState({
        error: {
          title: strings.Idea.NoIdeaFoundTitle,
          message: strings.Idea.NoIdeaFoundErrorMessage
        }
      })
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
  // On a narrow screen the menu, 340 px, took the whole width and left the ideas none: there it
  // starts closed (WCAG 1.4.10).
  const [isOpen, setIsOpen] = useState(() => !isNarrowScreen())

  // The menu's button goes with the menu, and the one beside the content comes as it closes: a
  // toggle gives the focus to the button that takes the other's place (WCAG 2.4.3).
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const contentButtonRef = useRef<HTMLButtonElement>(null)
  const isToggled = useRef(false)
  useEffect(() => {
    if (!isToggled.current) return
    isToggled.current = false
    const button = isOpen ? menuButtonRef.current : contentButtonRef.current
    button?.focus()
  }, [isOpen])

  /**
   * Closes the menu once an idea or the overview is chosen from it on a narrow screen, where the
   * menu covers what was chosen. The focus goes to the button beside the content.
   */
  const closeMenuOnNarrowScreen = () => {
    if (!isOpen || !isNarrowScreen()) return
    isToggled.current = true
    setIsOpen(false)
  }

  const handleToggle: AccordionToggleEventHandler<string> = (event, data) => {
    setOpenItems(data.openItems)
  }

  const ignoreFields = [
    'GtIdeaRecommendation',
    'GtIdeaRecommendationComment',
    'GtIdeaDecision',
    'GtIdeaDecisionComment'
  ]

  /**
   * The button that shows or hides the navigation menu, named by its tooltip.
   *
   * @param ref The menu's button or the one beside the content
   */
  const renderHamburger = (ref: RefObject<HTMLButtonElement>) => {
    return (
      <Tooltip content={strings.Idea.NavigationMenuLabel} relationship='label'>
        <Hamburger
          ref={ref}
          aria-expanded={isOpen}
          onClick={() => {
            isToggled.current = true
            setIsOpen(!isOpen)
          }}
        />
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
        <h3 className={styles.statusTitle}>{strings.Idea.StatusTitle}</h3>
        <dl className={styles.status}>
          {fieldValues
            .filter((model) => model.internalName.includes(filterKey))
            .map((model, idx) => (
              <IdeaField key={idx} className={styles.field} model={model} />
            ))}
        </dl>
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
    menuButtonRef,
    contentButtonRef,
    renderStatus,
    handleToggle,
    ignoreFields,
    isOpen,
    closeMenuOnNarrowScreen,
    openItems,
    fluentProviderId
  }
}
