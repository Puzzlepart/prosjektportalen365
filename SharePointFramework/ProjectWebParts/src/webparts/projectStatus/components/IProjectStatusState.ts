import { INewStatusReportModalField } from "./NewStatusReportModal/INewStatusReportModalProps";
import ProjectStatusReport from "../models/ProjectStatusReport";
import SectionModel from "./SectionModel";

export interface IProjectStatusData {
    reportFields?: INewStatusReportModalField[];
    entityFields?: any[];
    entityItem?: any;
    reportEditFormUrl?: string;
    reports?: ProjectStatusReport[];
    sections?: SectionModel[];
}

export interface IProjectStatusState {
    isLoading: boolean;
    showNewStatusReportModal?: boolean;
    data?: IProjectStatusData;
    selectedReport?: ProjectStatusReport;
}
