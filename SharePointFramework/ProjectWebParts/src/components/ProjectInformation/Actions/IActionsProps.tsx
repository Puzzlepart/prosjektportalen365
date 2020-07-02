import { ActionType } from './ActionType'

export interface IActionsProps {
    /**
     * Should the actions be hidden
     */
    hidden: boolean;

    /**
     * Version history URL
     */
    versionHistoryUrl: string;

    /**
     * Edit form URL
     */
    editFormUrl: string;

    /**
     * On sync properties action
     */
    onSyncProperties: () => void;

    /**
     * Custom actions
     */
    customActions?: ActionType[];
}
