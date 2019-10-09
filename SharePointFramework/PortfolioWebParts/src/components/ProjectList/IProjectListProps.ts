import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface IProjectListProps extends IBaseComponentProps {
  /**
   * Loading text
   */
  loadingText: string;

  /**
   * Seach box placeholder text
   */
  searchBoxPlaceholderText: string;

  /**
   * Term set ID for phase
   */
  phaseTermSetId: string;

  /**
   * Sort by property
   */
  sortBy?: string;

  /**
   *Show search box
   */
  showSearchBox?: boolean;

  /**
   * Show view selector
   */
  showViewSelector?: boolean;

  /**
   * Show as tiles (shown as list if false)
   */
  showAsTiles?: boolean;

  /**
   * Show Project Logo
   */
  showProjectLogo?: boolean;

  /**
   * Show Project Owner
   */
  showProjectOwner?: boolean;

  /**
   * Show Project Manager
   */
  showProjectManager?: boolean;

  /**
   * Columns
   */
  columns?: IColumn[];
}
