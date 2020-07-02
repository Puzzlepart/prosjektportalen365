import { Modal } from 'office-ui-fabric-react/lib/Modal'
import * as React from 'react'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationModalProps } from './IProjectInformationModalProps'
import styles from './ProjectInformationModal.module.scss'

export class ProjectInformationModal extends React.Component<IProjectInformationModalProps, {}> {
  public static defaultProps: Partial<IProjectInformationModalProps> = {};

  public render(): React.ReactElement<IProjectInformationModalProps> {
    return (
      <Modal {...this.props.modalProps} containerClassName={styles.projectInformationModal}>
        <ProjectInformation {...this.props} />
      </Modal>
    )
  }
}

export { IProjectInformationModalProps }

