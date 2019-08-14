import { IProjectInformationProps } from "../ProjectInformation";
import { IModalProps } from 'office-ui-fabric-react/lib/Modal';

export interface IProjectInformationModalProps extends IProjectInformationProps  {
  modalProps: IModalProps;
}
