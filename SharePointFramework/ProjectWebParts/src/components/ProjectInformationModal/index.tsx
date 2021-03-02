import { Modal } from 'office-ui-fabric-react/lib/Modal'
import React, { FunctionComponent } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import styles from './ProjectInformationModal.module.scss'
import { IProjectInformationModalProps } from './types'

export const ProjectInformationModal: FunctionComponent<IProjectInformationModalProps> = (
  props: IProjectInformationModalProps
) => {
  return (
    <Modal {...props.modalProps} containerClassName={styles.root}>
      <ProjectInformation {...props} />
    </Modal>
  )
}

export * from './types'
