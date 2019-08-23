import { IFetchDataForViewItemResult } from 'data/IFetchDataForViewResult';
import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { IContextualMenuProps } from 'office-ui-fabric-react/lib/ContextualMenu';
import { IFilterProps } from '../';
import { PortfolioOverviewErrorMessage } from './PortfolioOverviewErrorMessage';

export interface IPortfolioOverviewState {
    isLoading?: boolean;
    isExporting?: boolean;
    isChangingView?: PortfolioOverviewView;
    items?: IFetchDataForViewItemResult[];
    columns?: PortfolioOverviewColumn[];
    searchTerm?: string;
    filters?: IFilterProps[];
    currentView?: PortfolioOverviewView;
    activeFilters?: { SelectedColumns?: string[], [key: string]: string[] };
    error?: PortfolioOverviewErrorMessage;
    showFilterPanel?: boolean;
    groupBy?: PortfolioOverviewColumn;
    sortBy?: PortfolioOverviewColumn;
    showProjectInfo?: IFetchDataForViewItemResult;
    isCompact?: boolean;
    columnHeaderContextMenu?: IContextualMenuProps;
}

export interface IPortfolioOverviewHashStateState {
    viewId?: string;
    groupBy?: string;
}