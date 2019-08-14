import { View } from '../Views';
import { Phase, IPhaseChecklistItem } from 'models';


export default interface IBodyProps {
    newPhase: Phase;
    activePhase: Phase;
    checklistItems: IPhaseChecklistItem[];
    currentIdx: number;
    nextCheckPointAction: (statusValue: string, commentsValue: string, updateStatus: boolean) => Promise<void>;
    currentView: View;
    isLoading: boolean;
    onChangePhase: (phase: Phase) => Promise<void>;
    onDismiss: (event: any, reload?: boolean) => void;
}
