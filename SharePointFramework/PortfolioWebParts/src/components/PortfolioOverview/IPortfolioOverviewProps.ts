import { PageContext } from '@microsoft/sp-page-context';
import { PortfolioOverviewView } from 'models';
import { ConstrainMode, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';


export interface IPortfolioOverviewProps {
    entity: ISpEntityPortalServiceParams;
    pageContext: PageContext;
    title?: string;
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