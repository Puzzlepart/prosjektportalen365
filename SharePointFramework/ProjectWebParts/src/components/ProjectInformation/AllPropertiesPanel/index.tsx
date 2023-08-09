import { IPanelProps, Panel, PanelType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { ProjectProperties } from '../ProjectProperties'
import { useProjectInformationContext } from '../context'

export const AllPropertiesPanel: FC<IPanelProps> = () => {
  const context = useProjectInformationContext()
  return (
    <Panel
      isOpen={context.state.displayAllPropertiesPanel}
      onDismiss={() => context.setState({ displayAllPropertiesPanel: false })}
    >
      <ProjectProperties displayAllProperties />
    </Panel>
  )
}

AllPropertiesPanel.defaultProps = {
  type: PanelType.medium,
  headerText: strings.ProjectPropertiesListName,
  isLightDismiss: true,
  closeButtonAriaLabel: strings.CloseText
}
