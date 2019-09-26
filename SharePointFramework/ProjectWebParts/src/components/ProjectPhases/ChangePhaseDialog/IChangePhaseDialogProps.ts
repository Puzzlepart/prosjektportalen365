import { Phase } from 'models';
import { IDialogProps } from 'office-ui-fabric-react/lib/Dialog';

export default interface IChangePhaseDialogProps extends IDialogProps {
    /**
     * @todo Describe property
     */
    newPhase: Phase;

    /**
     * @todo Describe property
     */
    activePhase: Phase;

    /**
     * @todo Describe property
     */
    onChangePhase: (phase: Phase) => Promise<void>;
}

