import { Phase } from 'models';
import { IBaseWebPartComponentState } from '../BaseWebPartComponent';
import { IProjectPhasesData } from './IProjectPhasesData';
import { IProjectPhaseMouseOver } from './ProjectPhaseCallout/IProjectPhaseMouseOver';

export interface IProjectPhasesState extends IBaseWebPartComponentState<IProjectPhasesData> {
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
