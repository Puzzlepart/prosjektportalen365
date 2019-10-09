import { IUserMessageProps } from '../UserMessage';
import { IProjectInformationData } from './IProjectInformationData';
import { IProgressDialogProps } from '../ProgressDialog/IProgressDialogProps';
import { ProjectPropertyModel } from './ProjectProperties/ProjectProperty';
import { IBaseWebPartComponentState } from '../BaseWebPartComponent';

export interface IProjectInformationState extends IBaseWebPartComponentState<IProjectInformationData>  {
  /**
   * Properties
   */
  properties?: ProjectPropertyModel[];

  /**
   * Progress
   */
  progress?: IProgressDialogProps;

  /**
   * Message to show to the user
   */
  message?: IUserMessageProps;

  /**
   * @todo Describe property
   */
  confirmActionProps?: any;
}
