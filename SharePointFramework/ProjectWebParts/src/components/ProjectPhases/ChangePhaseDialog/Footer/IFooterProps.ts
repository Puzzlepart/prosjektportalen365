import { View } from '../Views';
import { Phase } from 'models';

export default interface IFooterProps {
    /**
     * New phase
     */
    newPhase: Phase;

    /**
     * Active phase
     */
    activePhase: Phase;

    /**
     * Current view
     */
    currentView: View;

    /**
     * Whether the component is loading
     */
    isLoading: boolean;

    /**
     * On change phase
     */
    onChangePhase: (phase: Phase) => Promise<void>;

    /**
     * On dismiss
     */
    onDismiss: (event: any, reload?: boolean) => void;

    /**
     * On change view
     */
    onChangeView: (view: View) => void;
}

