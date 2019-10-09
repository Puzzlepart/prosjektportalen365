import { View } from '../Views';
import { Phase, IPhaseChecklistItem } from 'models';


export default interface IBodyProps {
    /**
   * New phase
   */
    newPhase: Phase;

    /**
   * Active phase
   */
    activePhase: Phase;

    /**
   * Check list items
   */
    checklistItems: IPhaseChecklistItem[];

    /**
   * Current index
   */
    currentIdx: number;

    /**
   * Next checkpoint action callback
   */
    nextCheckPointAction: (statusValue: string, commentsValue: string, updateStatus: boolean) => Promise<void>;

    /**
   * Current view
   */
    currentView: View;

    /**
   * Is loading
   */
    isLoading: boolean;

    /**
   * On change phase callback
   */
    onChangePhase: (phase: Phase) => Promise<void>;

    /**
   * On dismiss callback
   */
    onDismiss: (event: any, reload?: boolean) => void;
}
