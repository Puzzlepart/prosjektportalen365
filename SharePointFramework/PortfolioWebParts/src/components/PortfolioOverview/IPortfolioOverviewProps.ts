import { IPortfolioOverviewConfiguration } from 'interfaces';
import { PortfolioOverviewView } from 'models';
import { ConstrainMode, DetailsListLayoutMode } from 'office-ui-fabric-react/lib/DetailsList';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface IPortfolioOverviewProps extends IBaseComponentProps {
    entity: ISpEntityPortalServiceParams;
    configuration: IPortfolioOverviewConfiguration;
    projectInfoFilterField?: string;
    projectInfoShowStatusReports?: boolean;
    projectInfoReportLinkUrlTemplate?: string;
    constrainMode?: ConstrainMode;
    layoutMode?: DetailsListLayoutMode;
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

export const PortfolioOverviewDefaultProps: Partial<IPortfolioOverviewProps> = {
    constrainMode: ConstrainMode.horizontalConstrained,
    layoutMode: DetailsListLayoutMode.fixedColumns,
};