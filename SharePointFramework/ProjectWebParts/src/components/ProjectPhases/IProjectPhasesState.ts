import { Phase } from 'models';
import { ChecklistData } from './ChecklistData';
import { IProjectPhaseMouseOver } from './ProjectPhaseCallout/IProjectPhaseMouseOver';

export interface IProjectPhasesData {
  phases?: Array<Phase>;
  currentPhase?: Phase;
  checklistData?: ChecklistData;
  phaseTextField?: string;
}

export interface IProjectPhasesState {
  isLoading: boolean;
  data: IProjectPhasesData;
  confirmPhase?: Phase;
  isChangingPhase?: boolean;
  phaseMouseOver?: IProjectPhaseMouseOver;
}
