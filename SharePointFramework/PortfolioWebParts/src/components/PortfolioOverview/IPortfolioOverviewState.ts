import { SearchResult } from '@pnp/sp';
import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IFilterProps } from '../';
import { IPortfolioOverviewErrorMessage } from './IPortfolioOverviewErrorMessage';

export interface IPortfolioOverviewState {
    isLoading?: boolean;
    isChangingView?: PortfolioOverviewView;
    items?: SearchResult[];
    columns?: IColumn[];
    searchTerm?: string;
    filters?: IFilterProps[];
    currentView?: PortfolioOverviewView;
    activeFilters?: { [key: string]: string[] };
    error?: IPortfolioOverviewErrorMessage;
    showFilterPanel?: boolean;
    groupBy?: PortfolioOverviewColumn;
    sortBy?: PortfolioOverviewColumn;
    showProjectInfo?: SearchResult;
}