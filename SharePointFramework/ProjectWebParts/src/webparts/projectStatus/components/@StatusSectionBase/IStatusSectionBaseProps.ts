import { WebPartContext } from '@microsoft/sp-webpart-base';
import ProjectStatusReport from "../../models/ProjectStatusReport";
import { IProjectStatusData } from '../IProjectStatusState';
import { IStatusElementProps } from '../StatusElement/IStatusElementProps';
import SectionModel from '../../models/SectionModel';

export interface IStatusSectionBaseProps {
  model?: SectionModel;
  headerProps: IStatusElementProps;
  report: ProjectStatusReport;
  context: WebPartContext;
  data?: IProjectStatusData;
}

export const StatusSectionDefaultProps: Partial<IStatusSectionBaseProps> = {};
