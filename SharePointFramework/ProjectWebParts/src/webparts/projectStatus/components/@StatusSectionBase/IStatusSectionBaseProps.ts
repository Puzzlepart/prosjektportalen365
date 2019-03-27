import { WebPartContext } from '@microsoft/sp-webpart-base';
import ProjectStatusReport from "../../models/ProjectStatusReport";
import { IProjectStatusData } from '../IProjectStatusState';
import { IStatusElementProps } from '../StatusElement/IStatusElementProps';
import SectionModel from '../SectionModel';

export interface IStatusSectionBaseProps {
  model?: SectionModel;
  headerProps: IStatusElementProps;
  report: ProjectStatusReport;
  context: WebPartContext;
  data?: IProjectStatusData;
  fieldNames?: string[];
}

export const StatusSectionDefaultProps: Partial<IStatusSectionBaseProps> = {};
