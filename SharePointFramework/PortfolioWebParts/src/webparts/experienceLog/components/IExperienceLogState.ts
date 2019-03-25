import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IExperienceLogState {
  isLoading: boolean;
  items?: any[];
  columns: IColumn[];
  groupBy?: IColumn;
  searchTerm?: string;
}
