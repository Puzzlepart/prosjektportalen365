import { IProjectInformationData } from './IProjectInformationData';

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
   * @todo describe property
   */
  error?: any;
}
