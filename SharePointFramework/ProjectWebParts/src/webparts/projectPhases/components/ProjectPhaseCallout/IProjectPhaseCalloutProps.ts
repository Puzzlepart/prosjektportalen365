import { ICalloutProps } from 'office-ui-fabric-react/lib/Callout';
import Phase from '../../models/Phase';

export interface IProjectPhaseMouseOver {
    target: any;
    model: Phase;
}

export interface IProjectPhaseCalloutProps extends ICalloutProps {
    phase: IProjectPhaseMouseOver;
    isCurrentPhase: boolean;
    phaseSubTextProperty: string;
    webAbsoluteUrl: string;
    onChangePhase: (phase: Phase) => void;
}