import { Panel, PanelType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectInformationContext } from '../context'
import { ProjectProperties } from '../ProjectProperties'

export const AllPropertiesPanel: FC = () => {
  const context = useContext(ProjectInformationContext)
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
