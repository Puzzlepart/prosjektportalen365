import { IPortfolioOverviewConfiguration } from 'interfaces';
import { PortfolioOverviewView } from 'models';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface IPortfolioOverviewProps extends IBaseComponentProps {
    /**
     * Settings for entity
     */
    entity: ISpEntityPortalServiceParams;

    /**
     * Configuration (columns and views etc)
     */
    configuration: IPortfolioOverviewConfiguration;

    /**
     * Filter field for <ProjectInformationModal />
     */
    projectInfoFilterField?: string;

    /**
     * List name for status reports
     */
    statusReportsListName?: string;    

    /**
     * List name for column config
     */
    columnConfigListName: string;

    /**
     * List name for columns
     */
    columnsListName: string;

    /**
     * List name for views
     */
    viewsListName: string;

    /**
     * Number of status reports to show
     */
    statusReportsCount?: number;

    /**
     * Link url template for status reports
     */
    statusReportsLinkUrlTemplate?: string;

    /**
     * Show Excel export button
     */
    showExcelExportButton?: boolean;

    /**
     * Show command bar
     */
    showCommandBar?: boolean;

    /**
     * Show group by
     */
    showGroupBy?: boolean;

    /**
     * Show search box
     */
    showSearchBox?: boolean;

    /**
     * Show filters
     */
    showFilters?: boolean;

    /**
     * Show view selector
     */
    showViewSelector?: boolean;

    /**
     * Default view id
     */
    defaultViewId?: string;
}