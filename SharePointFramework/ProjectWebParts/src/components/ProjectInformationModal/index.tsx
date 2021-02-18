import { Modal } from 'office-ui-fabric-react/lib/Modal'
import React, { Component, ReactElement } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationModalProps } from './types'
import styles from './ProjectInformationModal.module.scss'

export class ProjectInformationModal extends Component<IProjectInformationModalProps> {
  public static defaultProps: Partial<IProjectInformationModalProps> = {}

  public render(): ReactElement<IProjectInformationModalProps> {
    return (
      <Modal {...this.props.modalProps} containerClassName={styles.projectInformationModal}>
        <ProjectInformation {...this.props} />
      </Modal>
    )
  }
}

export { IProjectInformationModalProps }
