import { SearchResult } from '@pnp/sp';
import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { IContextualMenuProps } from 'office-ui-fabric-react/lib/ContextualMenu';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IFilterProps } from '../';
import { PortfolioOverviewErrorMessage } from './PortfolioOverviewErrorMessage';

export interface IPortfolioOverviewState {
    isLoading?: boolean;
    isExporting?: boolean;
    isChangingView?: PortfolioOverviewView;
    items?: SearchResult[];
    columns?: IColumn[];
    searchTerm?: string;
    filters?: IFilterProps[];
    currentView?: PortfolioOverviewView;
    activeFilters?: { [key: string]: string[] };
    error?: PortfolioOverviewErrorMessage;
    showFilterPanel?: boolean;
    groupBy?: PortfolioOverviewColumn;
    sortBy?: PortfolioOverviewColumn;
    showProjectInfo?: SearchResult;
    isCompact?: boolean;
    columnHeaderContextMenu?: IContextualMenuProps;
}

export interface IPortfolioOverviewHashStateState {
    viewId?: string;
    groupBy?: string;
}