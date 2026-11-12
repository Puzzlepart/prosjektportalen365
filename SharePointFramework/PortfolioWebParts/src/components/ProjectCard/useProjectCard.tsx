import React from 'react'
import { ButtonProps, useId } from '@fluentui/react-components'
import { IProjectCardProps } from './types'
import { useProjectCardState } from './useProjectCardState'
import { useProjectCardDataFetch } from './useProjectCardDataFetch'
import _ from 'underscore'
import { IProjectCardContext } from './context'
import { ProjectListModel } from 'pp365-shared-library'

/**
 * Load a project and build its card context and information-panel action.
 */
export function useProjectCard(props: IProjectCardProps) {
  const { state, setState } = useProjectCardState()
  const fluentProviderId = useId('fp-project-card')

  useProjectCardDataFetch(props, state.refetch, setState)

  /**
   * Get card actions. For now only `showProjectInfo` is handled.
   */
  function getCardActions(project: ProjectListModel): ButtonProps[] {
    return [
      {
        id: 'showProjectInfo',
        onClick: (event: React.MouseEvent<any>) => onExecuteCardAction(event, project),
        disabled: !project || !project.url || project.url === '#'
      }
    ]
  }

  /**
   * On execute card action. For now only `showProjectInfo` is handled.
   */
  function onExecuteCardAction(event: React.MouseEvent<any>, project: ProjectListModel) {
    event.preventDefault()
    event.stopPropagation()
    switch (event.currentTarget.id) {
      case 'showProjectInfo':
        setState({ showProjectInfo: project })
        break
    }
  }

  /**
   * Create card context for the provided project.
   */
  function createCardContext(project: ProjectListModel): IProjectCardContext {
    const shouldDisplay = (key: string) => _.contains(props.projectMetadata, key)
    return {
      ...props,
      actions: getCardActions(project),
      isDataLoaded: state.isDataLoaded,
      shouldDisplay,
      project
    }
  }

  return {
    state,
    setState,
    createCardContext,
    fluentProviderId
  }
}
