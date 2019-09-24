import { PageContext } from '@microsoft/sp-page-context';
import { ProjectStatusReport, SectionModel } from 'models';
import { IProjectStatusData } from '../IProjectStatusData';
import { IStatusElementProps } from '../StatusElement/IStatusElementProps';

export interface IStatusSectionBaseProps {
  model: SectionModel;
  headerProps: IStatusElementProps;
  report: ProjectStatusReport;
  pageContext: PageContext;
  hubSiteUrl: string;
  data?: IProjectStatusData;
}