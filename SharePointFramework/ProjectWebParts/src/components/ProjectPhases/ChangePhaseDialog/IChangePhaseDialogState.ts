import { View } from './Views'
import { IPhaseChecklistItem } from 'models'

export default interface IChangePhaseDialogState {
    isLoading?: boolean;
    checklistItems?: IPhaseChecklistItem[];
    currentIdx?: number;
    currentView?: View;
}

