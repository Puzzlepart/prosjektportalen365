import { ICalloutProps } from 'office-ui-fabric-react/lib/Callout';
import { Phase } from 'models';
import { IProjectPhaseMouseOver } from './IProjectPhaseMouseOver';

export interface IProjectPhaseCalloutProps extends ICalloutProps {
    phase: IProjectPhaseMouseOver;
    isCurrentPhase: boolean;
    phaseSubTextProperty: string;
    webAbsoluteUrl: string;
    onChangePhase: (phase: Phase) => void;
}