import { WebPartContext } from '@microsoft/sp-webpart-base';
import ProjectStatusReport from "../../models/ProjectStatusReport";

export interface IStatusSectionBaseProps {
    report: ProjectStatusReport;
    context: WebPartContext;
    entityFields: any[];
    entityItem: any;
    fieldNames?: string[];
}