import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { BasePanel } from '../BasePanel'
import { IBasePanelProps } from '../BasePanel/types'
import { ProjectProperties } from '../ProjectProperties'

export const AllPropertiesPanel: FC<IBasePanelProps> = () => {
  return (
    <BasePanel $type='AllPropertiesPanel' headerText={strings.ProjectPropertiesListName}>
      <ProjectProperties displayAllProperties />
    </BasePanel>
  )
}
