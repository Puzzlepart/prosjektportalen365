import { IEntityField } from 'sp-entityportal-service';
import { IGetPropertiesData } from 'data/SPDataAdapter/IGetPropertiesData';

export interface IProjectInformationData extends IGetPropertiesData {
  /**
   * Array of status reports
   */
  statusReports?: { Id: number, Created: string }[];

  /**
   * Array of fields from the entity
   */
  fields?: IEntityField[];
}