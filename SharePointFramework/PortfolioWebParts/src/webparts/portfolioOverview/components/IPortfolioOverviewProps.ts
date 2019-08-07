import { SelectionMode, ConstrainMode, DetailsListLayoutMode, } from 'office-ui-fabric-react/lib/DetailsList';
import { PortfolioOverviewView } from '../config';
import { PageContext } from '@microsoft/sp-page-context';
import { IPortfolioOverviewWebPartProps } from '../IPortfolioOverviewWebPartProps';
import { IExcelExportConfig } from '@Shared/interfaces';
import * as PortfolioOverviewWebPartStrings from 'PortfolioOverviewWebPartStrings';


export interface IPortfolioOverviewProps extends IPortfolioOverviewWebPartProps {
    pageContext: PageContext;
    title: string;
    showGroupBy?: boolean;
    modalHeaderClassName?: string;
    projectInfoFilterField?: string;
    constrainMode?: ConstrainMode;
    layoutMode?: DetailsListLayoutMode;
    selectionMode?: SelectionMode;
    excelExportConfig?: IExcelExportConfig;
    defaultView?: PortfolioOverviewView;
    viewSelectorEnabled?: boolean;
}

export const PortfolioOverviewDefaultProps: Partial<IPortfolioOverviewProps> = {
    showGroupBy: true,
    modalHeaderClassName: 'ms-font-xxl',
    projectInfoFilterField: 'GtPcPortfolioPage',
    constrainMode: ConstrainMode.horizontalConstrained,
    layoutMode: DetailsListLayoutMode.fixedColumns,
    selectionMode: SelectionMode.none,
    excelExportConfig: {
        fileNamePrefix: PortfolioOverviewWebPartStrings.ExcelExportFileNamePrefix,
        sheetName: 'Sheet1',
    },
    viewSelectorEnabled: true,
};