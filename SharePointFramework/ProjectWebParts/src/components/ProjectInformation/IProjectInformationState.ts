import { IProjectInformationData } from './IProjectInformationData';
import { ProjectPropertyModel } from './ProjectProperties/ProjectProperty/index';
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { IUserMessageProps } from './UserMessage';

export interface IProjectInformationState {
  /**
   * The component is loading
   */
  isLoading: boolean;

  /**
   * Data 
   */
  data?: IProjectInformationData;

  /**
   * Properties
   */
  properties?: ProjectPropertyModel[];

  /**
   * Error object
   */
  error?: any;

  /**
   * Progress
   */
  progress?: IProgressIndicatorProps;

  /**
   * Messagge
   */
  message?: IUserMessageProps;
}
