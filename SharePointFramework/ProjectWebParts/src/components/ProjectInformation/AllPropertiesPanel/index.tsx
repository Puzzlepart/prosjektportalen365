import strings from 'ProjectWebPartsStrings'
import { BasePanel, IBasePanelProps } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ProjectProperties } from '../ProjectProperties'
import { CLOSE_PANEL } from '../reducer'
import { useProjectInformationContext } from '../context'

export const AllPropertiesPanel: FC<IBasePanelProps> = (props) => {
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

AllPropertiesPanel.defaultProps = {
  $type: 'AllPropertiesPanel',
  headerText: strings.ProjectPropertiesHeader
}
