import ProjectStatusReport from "../models/ProjectStatusReport";
import SectionModel from "../models/SectionModel";

export interface IProjectStatusData {
    entityFields?: any[];
    entityItem?: any;
    defaultEditFormUrl?: string;
    reports?: ProjectStatusReport[];
    sections?: SectionModel[];
}
