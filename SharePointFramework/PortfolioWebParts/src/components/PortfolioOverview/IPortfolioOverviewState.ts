import { IFetchDataForViewItemResult } from 'data/IFetchDataForViewResult';
import { IContextualMenuProps } from 'office-ui-fabric-react/lib/ContextualMenu';
import { IFilterProps } from '../';
import { PortfolioOverviewErrorMessage } from './PortfolioOverviewErrorMessage';
import { PortfolioOverviewView, ProjectColumn } from 'shared/lib/models';

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
    items?: any[];

    /**
     * @todo describe property
     */
    selectedItems?: any[];

    /**
     * @todo describe property
     */
    columns?: ProjectColumn[];

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
    groupBy?: ProjectColumn;

    /**
     * @todo describe property
     */
    sortBy?: ProjectColumn;

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