import { IPortfolioOverviewConfiguration } from 'interfaces';
import { PortfolioOverviewView } from 'models';
import { DetailsListLayoutMode } from 'office-ui-fabric-react/lib/DetailsList';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface IPortfolioOverviewProps extends IBaseComponentProps {
    entity: ISpEntityPortalServiceParams;
    configuration: IPortfolioOverviewConfiguration;
    projectInfoFilterField?: string;
    statusReportsListName?: string;
    statusReportsCount?: number;
    statusReportsLinkUrlTemplate?: string;
    showExcelExportButton?: boolean;
    defaultView?: PortfolioOverviewView;
    defaultViewId?: string;
    showCommandBar?: boolean;
    showGroupBy?: boolean;
    showSearchBox?: boolean;
    showFilters?: boolean;
    showViewSelector?: boolean;
    columnConfigListName: string;
    columnsListName: string;
    viewsListName: string;
}

export const PortfolioOverviewDefaultProps: Partial<IPortfolioOverviewProps> = {};