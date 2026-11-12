import strings from 'ProjectWebPartsStrings'
import { BasePanel, IBasePanelProps, withDefaults } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ProjectProperties } from '../ProjectProperties'
import { CLOSE_PANEL } from '../reducer'
import { useProjectInformationContext } from '../context'

const ALL_PROPERTIES_PANEL_DEFAULT_PROPS: Partial<IBasePanelProps> = {
  $type: 'AllPropertiesPanel',
  headerText: strings.ProjectPropertiesHeader
}

/** Shows all project properties in a read-only panel. */
export const AllPropertiesPanel: FC<IBasePanelProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, ALL_PROPERTIES_PANEL_DEFAULT_PROPS)
  const context = useProjectInformationContext()

  return (
    // Text to read, nothing to work in: the body takes the focus so the keyboard can scroll it.
    <BasePanel
      {...props}
      headerText={context.props.title}
      open={context.state.activePanel === 'AllPropertiesPanel'}
      onClose={() => context.dispatch(CLOSE_PANEL())}
      isBodyFocusable
    >
      <ProjectProperties displayAllProperties />
    </BasePanel>
  )
}
