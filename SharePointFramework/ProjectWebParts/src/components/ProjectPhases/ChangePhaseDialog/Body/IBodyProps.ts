import { View } from '../Views';
import { Phase, IPhaseChecklistItem } from 'models';


export default interface IBodyProps {
    /**
   * @todo describe property
   */
    newPhase: Phase;

    /**
   * @todo describe property
   */
    activePhase: Phase;

    /**
   * @todo describe property
   */
    checklistItems: IPhaseChecklistItem[];

    /**
   * @todo describe property
   */
    currentIdx: number;

    /**
   * @todo describe property
   */
    nextCheckPointAction: (statusValue: string, commentsValue: string, updateStatus: boolean) => Promise<void>;

    /**
   * @todo describe property
   */
    currentView: View;

    /**
   * @todo describe property
   */
    isLoading: boolean;

    /**
   * @todo describe property
   */
    onChangePhase: (phase: Phase) => Promise<void>;

    /**
   * @todo describe property
   */
    onDismiss: (event: any, reload?: boolean) => void;
}
