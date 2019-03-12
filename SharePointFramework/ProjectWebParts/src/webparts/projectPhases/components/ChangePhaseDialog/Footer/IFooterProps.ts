import { View } from "../Views";
import Phase from "../../../models/Phase";

export default interface IFooterProps {
    newPhase: Phase;
    activePhase: Phase;
    currentView: View;
    isLoading: boolean;
    onChangePhase: (phase: Phase) => Promise<void>;
    onDismiss: (event: any, reload?: boolean) => void;
    onChangeView: (view: View) => void;
}

