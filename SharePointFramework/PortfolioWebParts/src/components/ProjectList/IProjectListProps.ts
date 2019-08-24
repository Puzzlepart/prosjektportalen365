import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface IProjectListProps extends IBaseComponentProps {
  /**
   * @todo describe property
   */
  loadingText: string;

  /**
   * @todo describe property
   */
  searchBoxPlaceholderText: string;

  /**
   * @todo describe property
   */
  phaseTermSetId: string;

  /**
   * @todo describe property
   */
  entity: ISpEntityPortalServiceParams;

  /**
   * @todo describe property
   */
  sortBy?: string;

  /**
   * @todo describe property
   */
  showSearchBox?: boolean;

  /**
   * @todo describe property
   */
  showViewSelector?: boolean;

  /**
   * @todo describe property
   */
  showAsTiles?: boolean;

  /**
   * @todo describe property
   */
  showProjectLogo?: boolean;

  /**
   * @todo describe property
   */
  showProjectOwner?: boolean;

  /**
   * @todo describe property
   */
  showProjectManager?: boolean;

  /**
   * @todo describe property
   */
  columns?: IColumn[];
}
