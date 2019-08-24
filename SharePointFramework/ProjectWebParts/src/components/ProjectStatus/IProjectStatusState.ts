import { ProjectStatusReport } from 'models';
import { IProjectStatusData } from './IProjectStatusData';

export interface IProjectStatusState {
    isLoading: boolean;
    newStatusCreated: boolean;
    showNewStatusReportModal?: boolean;
    sourceUrl?: string;
    error?: any;
    data?: IProjectStatusData;
    selectedReport?: ProjectStatusReport;
    hashState?: IProjectStatusHashState;
}

export interface IProjectStatusHashState {
    selectedReport?: string;
}