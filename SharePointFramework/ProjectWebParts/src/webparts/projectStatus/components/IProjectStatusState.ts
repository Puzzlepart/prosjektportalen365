import ProjectStatusReport from "../models/ProjectStatusReport";
import SectionModel from "../models/SectionModel";

export interface IProjectStatusData {
    entityFields?: any[];
    entityItem?: any;
    reportListProps?: { DefaultEditFormUrl: string, DefaultNewFormUrl: string };
    reports?: ProjectStatusReport[];
    sections?: SectionModel[];
}

export interface IProjectStatusState {
    isLoading: boolean;
    associateStatusItem: boolean;
    showNewStatusReportModal?: boolean;
    data?: IProjectStatusData;
    selectedReport?: ProjectStatusReport;
}
