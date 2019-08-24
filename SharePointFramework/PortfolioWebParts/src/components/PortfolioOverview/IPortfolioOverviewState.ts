import { IFetchDataForViewItemResult } from 'data/IFetchDataForViewResult';
import { PortfolioOverviewColumn, PortfolioOverviewView } from 'models';
import { IContextualMenuProps } from 'office-ui-fabric-react/lib/ContextualMenu';
import { IFilterProps } from '../';
import { PortfolioOverviewErrorMessage } from './PortfolioOverviewErrorMessage';

export interface IPortfolioOverviewState {
    /**
     * @todo describe property
     */
    isLoading?: boolean;

    /**
     * @todo describe property
     */
    isExporting?: boolean;

    /**
     * @todo describe property
     */
    isChangingView?: PortfolioOverviewView;

    /**
     * @todo describe property
     */
    items?: IFetchDataForViewItemResult[];

    /**
     * @todo describe property
     */
    columns?: PortfolioOverviewColumn[];

    /**
     * @todo describe property
     */
    searchTerm?: string;

    /**
     * @todo describe property
     */
    filters?: IFilterProps[];

    /**
     * @todo describe property
     */
    currentView?: PortfolioOverviewView;

    /**
     * @todo describe property
     */
    activeFilters?: { SelectedColumns?: string[], [key: string]: string[] };

    /**
     * @todo describe property
     */
    error?: PortfolioOverviewErrorMessage;

    /**
     * @todo describe property
     */
    showFilterPanel?: boolean;

    /**
     * @todo describe property
     */
    groupBy?: PortfolioOverviewColumn;

    /**
     * @todo describe property
     */
    sortBy?: PortfolioOverviewColumn;

    /**
     * @todo describe property
     */
    showProjectInfo?: IFetchDataForViewItemResult;

    /**
     * @todo describe property
     */
    isCompact?: boolean;

    /**
     * Props for column header context menu
     */
    columnContextMenu?: IContextualMenuProps;
}

export interface IPortfolioOverviewHashStateState {
    /**
     * viewId found in hash (document.location.hash)
     */
    viewId?: string;

    /**
     * groupBy found in hash (document.location.hash)
     */
    groupBy?: string;
}