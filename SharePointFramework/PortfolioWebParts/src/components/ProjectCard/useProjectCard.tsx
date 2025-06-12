import React from 'react'
import { useId } from '@fluentui/react-components'
import { IProjectCardProps } from './types'
import { useProjectCardState } from './useProjectCardState'
import { useProjectCardDataFetch } from './useProjectCardDataFetch'
import _ from 'lodash'
import styles from './ProjectCard.module.scss'
import { IProjectCardContext } from './context'

/**
 * Component logic hook for `ProjectCard` component.
 *
clear */
export function useProjectCard(props: IProjectCardProps) {
  const { state, setState } = useProjectCardState()
  const fluentProviderId = useId('fp-project-card')

  const context: IProjectCardContext = {
    props,
    state,
    setState
  }

  useProjectCardDataFetch(props, state.refetch, setState)

  return {
    context,
    fluentProviderId
  }
}
