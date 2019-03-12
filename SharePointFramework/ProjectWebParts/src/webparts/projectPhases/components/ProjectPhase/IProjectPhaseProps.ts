import Phase from "../../models/Phase";

export interface IProjectPhaseProps {
    phase: Phase;
    isCurrentPhase?: boolean;
    changePhaseEnabled?: boolean;
    onChangePhaseHandler?: (phase: Phase) => void;
    onOpenCallout: (target: HTMLSpanElement) => void;
}
