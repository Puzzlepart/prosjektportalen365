import strings from 'ProjectWebPartsStrings'
import { BasePanel, IBasePanelProps } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ProjectProperties } from '../ProjectProperties'
import { CLOSE_PANEL } from '../reducer'
import { useProjectInformationContext } from '../context'

export const AllPropertiesPanel: FC<IBasePanelProps> = (props) => {
  const context = useProjectInformationContext()

  return <BasePanel
    {...props}
    isOpen={context.state.activePanel === 'AllPropertiesPanel'}
    onDismiss={() => context.dispatch(CLOSE_PANEL())}
    onRenderBody={() => <ProjectProperties displayAllProperties />}
  />
}

AllPropertiesPanel.defaultProps = {
  $type: 'AllPropertiesPanel',
  headerText: strings.ProjectPropertiesHeader,
}
