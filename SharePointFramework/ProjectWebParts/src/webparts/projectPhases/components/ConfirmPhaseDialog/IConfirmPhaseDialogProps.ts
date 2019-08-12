import { Phase } from "../../models";

export interface IConfirmPhaseDialogProps {
    phase: Phase;
    onConfirm: (result: boolean) => void;
    isBlocking: boolean;
    isChangingPhase: boolean;
}