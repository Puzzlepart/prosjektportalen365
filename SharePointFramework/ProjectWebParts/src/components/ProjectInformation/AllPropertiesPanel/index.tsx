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

export const AllPropertiesPanel: FC<IBasePanelProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, ALL_PROPERTIES_PANEL_DEFAULT_PROPS)
  const context = useProjectInformationContext()

  return (
    <BasePanel
      {...props}
      headerText={context.props.title}
      open={context.state.activePanel === 'AllPropertiesPanel'}
      onClose={() => context.dispatch(CLOSE_PANEL())}
    >
      <ProjectProperties displayAllProperties />
    </BasePanel>
  )
}
