import ProjectStatusReport from "../models/ProjectStatusReport";
import { IProjectStatusData } from "./IProjectStatusData";

export interface IProjectStatusState {
    isLoading: boolean;
    newStatusCreated: boolean;
    showNewStatusReportModal?: boolean;
    data?: IProjectStatusData;
    selectedReport?: ProjectStatusReport;
}
