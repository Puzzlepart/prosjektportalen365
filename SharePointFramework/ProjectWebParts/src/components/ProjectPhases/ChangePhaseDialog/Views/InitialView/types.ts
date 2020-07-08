import { IPhaseChecklistItem } from 'models'

export interface IInitialViewProps {
  /**
  * Whether the component is loading
  */
  isLoading: boolean;

  /**
 * Current check list items
 */
  checklistItem: IPhaseChecklistItem;

  /**
 * Next check point ation callback
 */
  saveCheckPoint: (statusValue: string, commentsValue: string, updateStatus: boolean) => void;

  /**
 * Min length for comment
 */
  commentMinLength?: number;

  /**
 * Style for comment field
 */
  commentStyle?: React.CSSProperties;
}