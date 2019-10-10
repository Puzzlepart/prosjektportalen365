import { ICalloutProps } from 'office-ui-fabric-react/lib/Callout';
import { Phase } from 'models';
import { IProjectPhaseMouseOver } from './IProjectPhaseMouseOver';

export interface IProjectPhaseCalloutProps extends ICalloutProps {
    /**
     * Phase mouse over
     */
    phase: IProjectPhaseMouseOver;

    /**
     * Is the phase currently selected
     */
    isCurrentPhase: boolean;

    /**
     * URL for the web
     */
    webUrl: string;

    /**
     * Is the current user site admin
     */
    isSiteAdmin?: boolean;

    /**
     * On change phase callback
     */
    onChangePhase: (phase: Phase) => void;
}