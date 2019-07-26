import ProjectStatusReport from "../models/ProjectStatusReport";
import SectionModel from "../models/SectionModel";

export interface IProjectStatusData {
    entityFields?: any[];
    entityItem?: any;
    defaultNewFormUrl?: string;
    reports?: ProjectStatusReport[];
    sections?: SectionModel[];
}

export interface IProjectStatusState {
    isLoading: boolean;
    newStatusCreated: boolean;
    showNewStatusReportModal?: boolean;
    data?: IProjectStatusData;
    selectedReport?: ProjectStatusReport;
}
