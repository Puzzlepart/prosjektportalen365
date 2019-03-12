import { View } from "./Views";
import Phase from "../../models/Phase";

export default interface IChangePhaseDialogState {
    currentIdx?: number;
    isLoading?: boolean;
    currentView?: View;
}

