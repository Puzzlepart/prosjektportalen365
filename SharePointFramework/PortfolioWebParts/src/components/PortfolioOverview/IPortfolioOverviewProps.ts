import { PortfolioOverviewView } from 'models';
import { ConstrainMode, DetailsListLayoutMode } from 'office-ui-fabric-react/lib/DetailsList';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';
import { IBaseComponentProps } from '../';

export interface IPortfolioOverviewProps extends IBaseComponentProps {
    entity: ISpEntityPortalServiceParams;
    projectInfoFilterField?: string;
    constrainMode?: ConstrainMode;
    layoutMode?: DetailsListLayoutMode;
    excelExportEnabled?: boolean;
    defaultView?: PortfolioOverviewView;
    showGroupBy?: boolean;
    viewSelectorEnabled?: boolean;
}

export const PortfolioOverviewDefaultProps: Partial<IPortfolioOverviewProps> = {
    constrainMode: ConstrainMode.horizontalConstrained,
    layoutMode: DetailsListLayoutMode.fixedColumns,
};