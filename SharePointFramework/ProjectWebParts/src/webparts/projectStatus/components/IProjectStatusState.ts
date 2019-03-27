import ProjectStatusReport from "../models/ProjectStatusReport";
import SectionModel from "./SectionModel";

export interface IProjectStatusData {
    entityFields?: any[];
    entityItem?: any;
    reportList?: { DefaultEditFormUrl: string, DefaultNewFormUrl: string };
    reports?: ProjectStatusReport[];
    sections?: SectionModel[];
}

export interface IProjectStatusState {
    isLoading: boolean;
    showNewStatusReportModal?: boolean;
    data?: IProjectStatusData;
    selectedReport?: ProjectStatusReport;
}
