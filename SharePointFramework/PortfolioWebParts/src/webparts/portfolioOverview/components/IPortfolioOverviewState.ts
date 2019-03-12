import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { PortfolioOverviewView, PortfolioOverviewColumn, IPortfolioOverviewConfiguration } from '../config';

export interface IPortfolioOverviewErrorMessage {
    message: string;
    type: MessageBarType;
}

export interface IPortfolioOverviewState {
    isLoading?: boolean;
    isChangingView?: PortfolioOverviewView;
    configuration?: IPortfolioOverviewConfiguration;
    items?: any[];
    filteredItems?: any[];
    columns?: IColumn[];
    fieldNames?: string[];
    searchTerm?: string;
    filters?: any[];
    currentView?: PortfolioOverviewView;
    currentFilters?: { [key: string]: string[] };
    error?: IPortfolioOverviewErrorMessage;
    showFilterPanel?: boolean;
    groupBy?: PortfolioOverviewColumn;
    currentSort?: { fieldName: string, isSortedDescending: boolean };
    showProjectInfo?: any;
    excelExportStatus?: any;
    canUserManageWeb?: boolean;
}