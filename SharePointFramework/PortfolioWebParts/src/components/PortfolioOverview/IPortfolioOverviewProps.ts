import { IPortfolioOverviewConfiguration } from 'interfaces';
import { PortfolioOverviewView } from 'models';
import { ConstrainMode, DetailsListLayoutMode } from 'office-ui-fabric-react/lib/DetailsList';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';
import { IBaseComponentProps } from '../';

export interface IPortfolioOverviewProps extends IBaseComponentProps {
    entity: ISpEntityPortalServiceParams;
    configuration: IPortfolioOverviewConfiguration;
    projectInfoFilterField?: string;
    constrainMode?: ConstrainMode;
    layoutMode?: DetailsListLayoutMode;
    excelExportEnabled?: boolean;
    defaultView?: PortfolioOverviewView;
    defaultViewId?: number;
    showGroupBy?: boolean;
    viewSelectorEnabled?: boolean;
    columnConfigListName: string;
    columnsListName: string;
    viewsListName: string;
}

export const PortfolioOverviewDefaultProps: Partial<IPortfolioOverviewProps> = {
    constrainMode: ConstrainMode.horizontalConstrained,
    layoutMode: DetailsListLayoutMode.fixedColumns,
};