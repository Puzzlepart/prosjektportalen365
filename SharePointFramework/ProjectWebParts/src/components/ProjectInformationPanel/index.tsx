import { Panel, PanelType } from '@fluentui/react'
import React, { FC, useEffect, useState } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationPanelProps } from './types'

export const ProjectInformationPanel: FC<IProjectInformationPanelProps> = (props) => {
  const [showPanel, setShowPanel] = useState(!props.hidden)

  useEffect(() => {
    if (!props.onRenderToggleElement) setShowPanel(!props.hidden)
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
        {...props.panelProps}
      >
        <ProjectInformation {...props} />
      </Panel>
    </>
  )
}

ProjectInformationPanel.defaultProps = {
  hidden: true
}

export * from './types'
