import { Phase } from 'models'
import { IDialogProps } from 'office-ui-fabric-react/lib/Dialog'

export default interface IChangePhaseDialogProps extends IDialogProps {
    /**
     * New phase
     */
    newPhase: Phase;

    /**
     * Active phase
     */
    activePhase: Phase;

    /**
     * On change phase
     */
    onChangePhase: (phase: Phase) => Promise<void>;
}

