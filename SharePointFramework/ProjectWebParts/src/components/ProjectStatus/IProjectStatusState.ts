import { ProjectStatusReport } from 'models';
import { IProjectStatusData } from './IProjectStatusData';

export interface IProjectStatusState {
    
    /**
     * @todo describe property
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
    sourceUrl?: string;
    
    /**
     * @todo describe property
     */
    error?: any;
    
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
    selectedReport?: string;
}