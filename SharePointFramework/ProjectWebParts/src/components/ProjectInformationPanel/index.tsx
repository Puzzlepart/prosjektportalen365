import { useRestoreFocusTarget } from '@fluentui/react-components'
import React, { cloneElement, FC, useEffect } from 'react'
import { useBoolean } from 'usehooks-ts'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationPanelProps } from './types'
import { BasePanel, withDefaults } from 'pp365-shared-library'

const PROJECT_INFORMATION_PANEL_DEFAULT_PROPS: Partial<IProjectInformationPanelProps> = {
  hidden: true
}

/**
 * The project information in a side panel, named after the project in its header. The element it
 * renders to open it is marked as the panel's restore target, so closing the panel gives it the
 * focus back (WCAG 2.4.3): Fluent's drawer gives focus back only to such a target, and a toggle
 * that opens it from state has none. A caller that opens the panel through `hidden` marks its
 * own button with `useRestoreFocusTarget`.
 */
export const ProjectInformationPanel: FC<IProjectInformationPanelProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, PROJECT_INFORMATION_PANEL_DEFAULT_PROPS)
  const panelState = useBoolean(!props.hidden)
  const restoreFocusTarget = useRestoreFocusTarget()
  const toggleElement = props.onRenderToggleElement?.(panelState.toggle)

  useEffect(() => {
    if (!props.onRenderToggleElement) panelState.setValue(!props.hidden)
  }, [props.hidden])

  return (
    <>
      {props.children}
      {toggleElement && cloneElement(toggleElement, restoreFocusTarget)}
      {/* The title goes in the drawer's header, on the close button's line, not in the body. */}
      <BasePanel
        open={panelState.value}
        size={'medium'}
        isLightDismiss={true}
        onClose={panelState.setFalse}
        headerText={props.title}
        {...props.panelProps}
      >
        <ProjectInformation {...props} hideTitle />
      </BasePanel>
    </>
  )
}

export * from './types'
