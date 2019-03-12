import Phase from "../../models/Phase";
import { List } from '@pnp/sp';
import {IDialogProps} from 'office-ui-fabric-react/lib/Dialog';

export default interface IChangePhaseDialogProps extends IDialogProps {
    newPhase: Phase;
    activePhase: Phase;
    phaseChecklist: List;
    onChangePhase: (phase: Phase) => Promise<void>;
}

