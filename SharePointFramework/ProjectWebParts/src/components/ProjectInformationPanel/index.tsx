import React, { FC, useEffect } from 'react'
import { useBoolean } from 'usehooks-ts'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationPanelProps } from './types'
import styles from './ProjectInformationPanel.module.scss'
import { BasePanel } from 'pp365-shared-library'

export const ProjectInformationPanel: FC<IProjectInformationPanelProps> = (props) => {
  const panelState = useBoolean(!props.hidden)

  useEffect(() => {
    if (!props.onRenderToggleElement) panelState.setValue(!props.hidden)
  }, [props.hidden])

  return (
    <>
      {props.children}
      {props.onRenderToggleElement && props.onRenderToggleElement(panelState.toggle)}
      <BasePanel
        isOpen={panelState.value}
        size={'medium'}
        isLightDismiss={true}
        onDismiss={panelState.setFalse}
        {...props.panelProps}
      >
        <ProjectInformation {...props} className={styles.projectInformation} />
      </BasePanel>
    </>
  )
}

ProjectInformationPanel.defaultProps = {
  hidden: true
}

export * from './types'
