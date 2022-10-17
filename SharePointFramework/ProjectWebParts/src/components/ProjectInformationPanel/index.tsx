import { Panel, PanelType } from '@fluentui/react'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationPanelProps } from './types'

export const ProjectInformationPanel: FunctionComponent<IProjectInformationPanelProps> = (
  props
) => {
  const [showPanel, setShowPanel] = useState(!props.hidden)

  useEffect(() => {
    setShowPanel(!props.hidden)
  }, [props.hidden])

  return (
    <>
      {props.children}
      {props.onRenderToggleElement && props.onRenderToggleElement(() => setShowPanel(!showPanel))}
      <Panel
        isOpen={showPanel}
        type={PanelType.medium}
        onDismiss={() => setShowPanel(false)}
        isLightDismiss={true}
        {...props.panelProps}>
        <ProjectInformation {...props} />
      </Panel>
    </>
  )
}

ProjectInformationPanel.defaultProps = {
  hidden: false
}

export * from './types'
