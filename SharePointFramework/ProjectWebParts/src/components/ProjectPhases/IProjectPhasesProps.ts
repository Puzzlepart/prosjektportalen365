import { IBaseWebPartComponentProps } from '../BaseWebPartComponent';

export interface IProjectPhasesProps extends IBaseWebPartComponentProps {
  /**
   * Field name for phase field
   */
  phaseField: string;

  /**
   * Automatic reload after phase change
   */
  automaticReload: boolean;

  /**
   * Reload timeout
   */
  reloadTimeout: number;

  /**
   * Should phase change be confirmed
   */
  confirmPhaseChange: boolean;

  /**
   * View name for current phase
   */
  currentPhaseViewName: boolean;

  /**
   * Property for phase sub text
   */
  phaseSubTextProperty: string;
}
