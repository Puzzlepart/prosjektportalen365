import { PageContext } from '@microsoft/sp-page-context';
import ProjectStatusReport from "../../models/ProjectStatusReport";
import { IProjectStatusData } from "../IProjectStatusData";
import { IStatusElementProps } from '../StatusElement/IStatusElementProps';
import SectionModel from '../../models/SectionModel';
import { IHubSite } from 'sp-hubsite-service';

export interface IStatusSectionBaseProps {
  model?: SectionModel;
  headerProps: IStatusElementProps;
  report: ProjectStatusReport;
  pageContext: PageContext;
  hubSite: IHubSite;
  data?: IProjectStatusData;
}

export const StatusSectionDefaultProps: Partial<IStatusSectionBaseProps> = {};
