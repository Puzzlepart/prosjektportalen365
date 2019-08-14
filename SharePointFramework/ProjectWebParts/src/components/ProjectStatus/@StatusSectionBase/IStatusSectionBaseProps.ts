import { PageContext } from '@microsoft/sp-page-context';
import { IProjectStatusData } from "../IProjectStatusData";
import { IStatusElementProps } from '../StatusElement/IStatusElementProps';
import { IHubSite } from 'sp-hubsite-service';
import { SectionModel, ProjectStatusReport } from 'models';

export interface IStatusSectionBaseProps {
  model?: SectionModel;
  headerProps: IStatusElementProps;
  report: ProjectStatusReport;
  pageContext: PageContext;
  hubSite: IHubSite;
  data?: IProjectStatusData;
}

export const StatusSectionDefaultProps: Partial<IStatusSectionBaseProps> = {};
