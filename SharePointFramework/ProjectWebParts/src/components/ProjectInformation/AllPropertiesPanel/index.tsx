import strings from 'ProjectWebPartsStrings'
import { BasePanel, IBasePanelProps } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ProjectProperties } from '../ProjectProperties'

export const AllPropertiesPanel: FC<IBasePanelProps> = (props) => {
  return <BasePanel {...props} onRenderBody={() => <ProjectProperties displayAllProperties />} />
}

AllPropertiesPanel.defaultProps = {
  $type: 'AllPropertiesPanel',
  headerText: strings.ProjectPropertiesListName
}
