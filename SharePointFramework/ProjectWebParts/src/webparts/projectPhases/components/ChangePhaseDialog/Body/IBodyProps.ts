import { View } from "../Views";
import Phase from "../../../models/Phase";

export default interface IBodyProps {
    newPhase: Phase;
    activePhase: Phase;
    openCheckListItems: any[];
    currentIdx: number;
    nextCheckPointAction: any;
    currentView: View;
    isLoading: boolean;
    onChangePhase: (phase: Phase) => Promise<void>;
    onDismiss: (event: any, reload?: boolean) => void;
}
