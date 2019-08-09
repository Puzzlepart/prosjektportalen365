import { SelectionMode, ConstrainMode, DetailsListLayoutMode, } from 'office-ui-fabric-react/lib/DetailsList';
import { PortfolioOverviewView } from '../config';
import { PageContext } from '@microsoft/sp-page-context';
import { IPortfolioOverviewWebPartProps } from '../IPortfolioOverviewWebPartProps';
import { IExcelExportConfig } from '@Shared/interfaces';
import * as PortfolioOverviewWebPartStrings from 'PortfolioOverviewWebPartStrings';


export interface IPortfolioOverviewProps extends IPortfolioOverviewWebPartProps {
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