import { ProjectStatusReport, SectionModel } from 'models';

export interface IProjectStatusData {
    entityFields?: any[];
    entityItem?: any;
    defaultEditFormUrl?: string;
    reports?: ProjectStatusReport[];
    sections?: SectionModel[];
}
