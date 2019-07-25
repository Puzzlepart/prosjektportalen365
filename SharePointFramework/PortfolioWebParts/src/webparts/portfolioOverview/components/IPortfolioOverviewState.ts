import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { PortfolioOverviewView, PortfolioOverviewColumn, IPortfolioOverviewConfiguration } from '../config';
import { IFilterProps } from '../../../components/FilterPanel';

export interface IPortfolioOverviewErrorMessage {
    message: string;
    type: MessageBarType;
}

export interface IPortfolioOverviewState {
    isLoading?: boolean;
    isChangingView?: PortfolioOverviewView;
    configuration?: IPortfolioOverviewConfiguration;
    items?: any[];
    columns?: IColumn[];
    searchTerm?: string;
    filters?: IFilterProps[];
    currentView?: PortfolioOverviewView;
    activeFilters?: { [key: string]: string[] };
    error?: IPortfolioOverviewErrorMessage;
    showFilterPanel?: boolean;
    groupBy?: PortfolioOverviewColumn;
    sortBy?: { fieldName: string, isSortedDescending: boolean };
    showProjectInfo?: any;
    excelExportStatus?: any;
    canUserManageWeb?: boolean;
}