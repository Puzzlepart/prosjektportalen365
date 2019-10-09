import { IPhaseChecklistItem } from 'models';

export interface IInitialViewProps {
  /**
 * @todo describe property
 */
  isLoading: boolean;

  /**
 * @todo describe property
 */
  currentChecklistItem: IPhaseChecklistItem;

  /**
 * @todo describe property
 */
  nextCheckPointAction: (statusValue: string, commentsValue: string, updateStatus: boolean) => void;

  /**
 * @todo describe property
 */
  commentMinLength?: number;

  /**
 * @todo describe property
 */
  commentStyle?: React.CSSProperties;
}