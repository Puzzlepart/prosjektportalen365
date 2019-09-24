import { ICalloutProps } from 'office-ui-fabric-react/lib/Callout';
import { Phase } from 'models';
import { IProjectPhaseMouseOver } from './IProjectPhaseMouseOver';

export interface IProjectPhaseCalloutProps extends ICalloutProps {
    /**
     * @todo Describe property
     */
    phase: IProjectPhaseMouseOver;

    /**
     * @todo Describe property
     */
    isCurrentPhase: boolean;

    /**
     * @todo Describe property
     */
    phaseSubTextProperty: string;

    /**
     * URL for the web
     */
    webUrl: string;

    /**
     * @todo Describe property
     */
    isSiteAdmin?: boolean;

    /**
     * @todo Describe property
     */
    onChangePhase: (phase: Phase) => void;
}