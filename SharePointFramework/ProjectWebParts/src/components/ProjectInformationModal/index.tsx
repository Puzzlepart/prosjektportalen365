import { Modal } from '@fluentui/react/lib/Modal'
import React, { FC } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import styles from './ProjectInformationModal.module.scss'
import { IProjectInformationModalProps } from './types'

export const ProjectInformationModal: FC<IProjectInformationModalProps> = (
  props: IProjectInformationModalProps
) => {
  return (
    <Modal {...props.modalProps} containerClassName={styles.root}>
      <ProjectInformation {...props} />
    </Modal>
  )
}

export * from './types'
