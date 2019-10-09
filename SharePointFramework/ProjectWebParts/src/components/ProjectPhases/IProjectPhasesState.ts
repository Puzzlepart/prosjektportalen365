import { Phase } from 'models';
import { IBaseWebPartComponentState } from '../BaseWebPartComponent';
import { IProjectPhasesData } from './IProjectPhasesData';
import { IProjectPhaseMouseOver } from './ProjectPhaseCallout/IProjectPhaseMouseOver';

export interface IProjectPhasesState extends IBaseWebPartComponentState<IProjectPhasesData> {
  /**
   * Confirm phase
   */
  confirmPhase?: Phase;

  /**
   * Is changing phase
   */
  isChangingPhase?: boolean;

  /**
   * Phase mouse over
   */
  phaseMouseOver?: IProjectPhaseMouseOver;
}
