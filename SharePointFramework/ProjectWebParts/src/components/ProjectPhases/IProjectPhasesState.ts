import { Phase } from 'models';
import { IProjectPhaseMouseOver } from './ProjectPhaseCallout/IProjectPhaseMouseOver';
import { IProjectPhasesData } from './IProjectPhasesData';

export interface IProjectPhasesState {
  /**
   * @todo describe property
   */
  isLoading: boolean;

  /**
   * @todo describe property
   */
  data: IProjectPhasesData;

  /**
   * @todo describe property
   */
  error?: any;

  /**
   * Is the component hidden
   */
  hidden?: boolean;

  /**
   * @todo describe property
   */
  confirmPhase?: Phase;

  /**
   * @todo describe property
   */
  isChangingPhase?: boolean;

  /**
   * @todo describe property
   */
  phaseMouseOver?: IProjectPhaseMouseOver;
}
