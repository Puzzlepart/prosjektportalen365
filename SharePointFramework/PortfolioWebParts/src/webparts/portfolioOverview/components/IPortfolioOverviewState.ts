import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { PortfolioOverviewView, PortfolioOverviewColumn, IPortfolioOverviewConfiguration } from '../config';
import { IFilterProps } from '../../../components/FilterPanel';
import { IFetchDataItem } from '../data';
import { IPortfolioOverviewErrorMessage } from './IPortfolioOverviewErrorMessage';


export interface IPortfolioOverviewState {
    isLoading?: boolean;
    isChangingView?: PortfolioOverviewView;
    configuration?: IPortfolioOverviewConfiguration;
    items?: IFetchDataItem[];
    columns?: IColumn[];
    searchTerm?: string;
    filters?: IFilterProps[];
    currentView?: PortfolioOverviewView;
    activeFilters?: { [key: string]: string[] };
    error?: IPortfolioOverviewErrorMessage;
    showFilterPanel?: boolean;
    groupBy?: PortfolioOverviewColumn;
    sortBy?: PortfolioOverviewColumn;
    showProjectInfo?: IFetchDataItem;
    excelExportStatus?: any;
    canUserManageWeb?: boolean;
}