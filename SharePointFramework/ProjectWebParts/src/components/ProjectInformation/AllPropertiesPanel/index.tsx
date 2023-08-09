import { Panel, PanelType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { ProjectProperties } from '../ProjectProperties'
import { useProjectInformationContext } from '../context'

export const AllPropertiesPanel: FC = () => {
  const context = useProjectInformationContext()
  return (
    <Panel
      type={PanelType.medium}
      headerText={strings.ProjectPropertiesListName}
      isOpen={context.state.displayAllPropertiesPanel}
      onDismiss={() => context.setState({ displayAllPropertiesPanel: false })}
      isLightDismiss
      closeButtonAriaLabel={strings.CloseText}
    >
      <ProjectProperties properties={context.state.allProperties} />
    </Panel>
  )
}
