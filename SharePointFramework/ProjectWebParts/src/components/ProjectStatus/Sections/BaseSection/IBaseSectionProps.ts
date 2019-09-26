import { ProjectStatusReport, SectionModel } from 'models';
import { IProjectStatusData } from '../../IProjectStatusData';
import { IStatusElementProps } from '../../StatusElement/IStatusElementProps';

export interface IBaseSectionProps {
  /**
   * @todo Describe property
   */
  model: SectionModel;

  /**
   * @todo Describe property
   */
  headerProps: IStatusElementProps;

  /**
   * @todo Describe property
   */
  report: ProjectStatusReport;

  /**
   * @todo Describe property
   */
  data?: IProjectStatusData;

  /**
   * URL for the hub site
   */
  hubSiteUrl: string;

  /**
   * ID of the site
   */
  siteId: string;

  /**
   * URL for the web
   */
  webUrl: string;
}