import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { BasePanel, ClosePanelButton } from '../BasePanel'
import { IBasePanelProps } from '../BasePanel/types'
import { ProjectProperties } from '../ProjectProperties'

export const AllPropertiesPanel: FC<IBasePanelProps> = (props) => {
  return (
    <BasePanel
      {...props}
      onRenderFooterContent={() => <ClosePanelButton noMargin />}
      onRenderBody={() => (
        <ProjectProperties displayAllProperties />
      )} />
  )
}

AllPropertiesPanel.defaultProps = {
  $type: 'AllPropertiesPanel',
  headerText: strings.ProjectPropertiesListName
}
