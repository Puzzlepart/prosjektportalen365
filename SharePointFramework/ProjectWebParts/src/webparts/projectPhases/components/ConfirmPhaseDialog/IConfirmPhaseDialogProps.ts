import Phase from "../../models/Phase";

export interface IConfirmPhaseDialogProps {
    phase: Phase;
    onConfirm: (result: boolean) => void;
    isBlocking: boolean;
    isChangingPhase: boolean;
}