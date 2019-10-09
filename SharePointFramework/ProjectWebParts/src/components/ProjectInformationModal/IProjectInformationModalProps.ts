import { IModalProps } from 'office-ui-fabric-react/lib/Modal';
import { IProjectInformationProps } from '../ProjectInformation';

export interface IProjectInformationModalProps extends IProjectInformationProps {
  /**
   * Props for the modal
   */
  modalProps: IModalProps;
}
