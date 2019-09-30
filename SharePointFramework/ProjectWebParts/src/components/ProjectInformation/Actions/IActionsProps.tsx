import { ActionType } from './ActionType';

export interface IActionsProps {
    /**
     * @todo Describe property
     */
    hidden: boolean;

    /**
     * @todo Describe property
     */
    versionHistoryUrl: string;

    /**
     * @todo Describe property
     */
    editFormUrl: string;

    /**
     * @todo Describe property
     */
    onSyncProperties: () => void;

    /**
     * @todo Describe property
     */
    customActions?: ActionType[];
}
