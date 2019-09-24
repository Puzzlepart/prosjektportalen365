import { Phase } from 'models';

export interface IProjectPhaseProps {
    /**
     * @todo Describe property
     */
    phase: Phase;

    /**
     * @todo Describe property
     */
    isCurrentPhase?: boolean;

    /**
     * @todo Describe property
     */
    changePhaseEnabled?: boolean;

    /**
     * @todo Describe property
     */
    onChangePhaseHandler?: (phase: Phase) => void;

    /**
     * @todo Describe property
     */
    onOpenCallout: (target: any) => void;
}
