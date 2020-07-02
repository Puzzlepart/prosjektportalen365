import { IBaseWebPartComponentProps } from '../BaseWebPartComponent'

export interface IProjectPhasesProps extends IBaseWebPartComponentProps {
  /**
   * Field name for phase field
   */
  phaseField: string;

  /**
   * Should phase change be confirmed
   */
  confirmPhaseChange: boolean;

  /**
   * View name for current phase
   */
  currentPhaseViewName: boolean;
}
