import { ProjectStatusReport } from 'models';
import { IProjectStatusData } from './IProjectStatusData';

export interface IProjectStatusState {
    /**
    * The component is loading
    */
    isLoading: boolean;

    /**
     * @todo describe property
     */
    newStatusCreated: boolean;

    /**
     * @todo describe property
     */
    showNewStatusReportModal?: boolean;

    /**
     * @todo describe property
     */
    sourceUrl?: string;

    /**
     * @todo describe property
     */
    error?: string;

    /**
     * @todo describe property
     */
    data?: IProjectStatusData;

    /**
     * @todo describe property
     */
    selectedReport?: ProjectStatusReport;

    /**
     * @todo describe property
     */
    hashState?: IProjectStatusHashState;
}

export interface IProjectStatusHashState {
    /**
     * @todo describe property
     */
    selectedReport?: string;
}