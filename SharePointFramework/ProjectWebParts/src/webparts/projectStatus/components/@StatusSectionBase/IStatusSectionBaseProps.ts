import { PageContext } from '@microsoft/sp-page-context';
import ProjectStatusReport from "../../models/ProjectStatusReport";
import { IProjectStatusData } from '../IProjectStatusState';
import { IStatusElementProps } from '../StatusElement/IStatusElementProps';
import SectionModel from '../../models/SectionModel';

export interface IStatusSectionBaseProps {
  model?: SectionModel;
  headerProps: IStatusElementProps;
  report: ProjectStatusReport;
  pageContext: PageContext;
  data?: IProjectStatusData;
}

export const StatusSectionDefaultProps: Partial<IStatusSectionBaseProps> = {};
