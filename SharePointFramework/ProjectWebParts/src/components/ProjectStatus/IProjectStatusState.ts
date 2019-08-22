import { ProjectStatusReport } from "models";
import { IProjectStatusData } from "./IProjectStatusData";

export interface IProjectStatusState {
    isLoading: boolean;
    newStatusCreated: boolean;
    showNewStatusReportModal?: boolean;
    error?: any;
    data?: IProjectStatusData;
    selectedReport?: ProjectStatusReport;
}
