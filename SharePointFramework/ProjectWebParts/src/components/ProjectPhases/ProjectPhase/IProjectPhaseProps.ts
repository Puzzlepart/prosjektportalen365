import { Phase } from 'models';

export interface IProjectPhaseProps {
    phase: Phase;
    isCurrentPhase?: boolean;
    changePhaseEnabled?: boolean;
    onChangePhaseHandler?: (phase: Phase) => void;
    onOpenCallout: (target: any) => void;
}
