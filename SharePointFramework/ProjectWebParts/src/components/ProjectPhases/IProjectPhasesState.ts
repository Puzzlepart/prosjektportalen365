import { Phase } from 'models';
import { ChecklistData } from './ChecklistData';
import { IProjectPhaseMouseOver } from './ProjectPhaseCallout/IProjectPhaseMouseOver';

export interface IProjectPhasesData {
  /**
   * @todo describe property
   */
  phases?: Phase[];

  /**
   * @todo describe property
   */
  currentPhase?: Phase;

  /**
   * @todo describe property
   */
  checklistData?: ChecklistData;

  /**
   * @todo describe property
   */
  phaseTextField?: string;
}

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
