import { IGetPropertiesData } from 'data';
import { IEntityField } from 'sp-entityportal-service';

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