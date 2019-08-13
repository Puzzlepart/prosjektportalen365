import { PageContext } from '@microsoft/sp-page-context';
import { IExcelExportConfig } from '@Shared/interfaces';
import { PortfolioOverviewView } from 'models';
import { ConstrainMode, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import * as PortfolioOverviewWebPartStrings from 'PortfolioOverviewWebPartStrings';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';


export interface IPortfolioOverviewProps {
    entity: ISpEntityPortalServiceParams;
    pageContext: PageContext;
    title?: string;
    projectInfoFilterField?: string;
    constrainMode?: ConstrainMode;
    layoutMode?: DetailsListLayoutMode;
    selectionMode?: SelectionMode;
    excelExportConfig?: IExcelExportConfig;
    defaultView?: PortfolioOverviewView;
    showGroupBy?: boolean;
    viewSelectorEnabled?: boolean;
}

export const PortfolioOverviewDefaultProps: Partial<IPortfolioOverviewProps> = {
    title: PortfolioOverviewWebPartStrings.Title,
    projectInfoFilterField: 'GtShowFieldPortfolio',
    constrainMode: ConstrainMode.horizontalConstrained,
    layoutMode: DetailsListLayoutMode.fixedColumns,
    selectionMode: SelectionMode.none,
    excelExportConfig: {
        fileNamePrefix: PortfolioOverviewWebPartStrings.ExcelExportFileNamePrefix,
        sheetName: 'Sheet1',
    },
    showGroupBy: true,
    viewSelectorEnabled: true,
};