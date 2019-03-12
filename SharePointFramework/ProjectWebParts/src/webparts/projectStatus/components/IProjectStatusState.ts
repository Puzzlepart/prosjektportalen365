import { INewStatusReportModalField } from "./NewStatusReportModal/INewStatusReportModalProps";
import ProjectStatusReport from "../models/ProjectStatusReport";

export interface IProjectStatusData {
    reportFields?: INewStatusReportModalField[];
    entityFields?: any[];
    entityItem?: any;
    reportEditFormUrl?: string;
    reports?: ProjectStatusReport[];
}

export interface IProjectStatusState {
    isLoading: boolean;
    showNewStatusReportModal?: boolean;    
    data?: IProjectStatusData;
    selectedReport?: ProjectStatusReport;
}
