import { IProjectInformationData } from './IProjectInformationData';
import { ProjectPropertyModel } from './ProjectProperty';

export interface IProjectInformationState {
  /**
   * @todo describe property
   */
  isLoading: boolean;

  /**
   * @todo describe property
   */
  data?: IProjectInformationData;

  /**
   * Properties
   */
  properties?: ProjectPropertyModel[];

  /**
   * @todo describe property
   */
  error?: any;

  /**
   * @todo describe property
   */
  onSyncPropertiesEnabled?: boolean;
}
