import { SelectionMode, ConstrainMode, DetailsListLayoutMode, } from 'office-ui-fabric-react/lib/DetailsList';
import { PortfolioOverviewView } from '../config';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IPortfolioOverviewWebPartProps } from '../IPortfolioOverviewWebPartProps';

export interface IPortfolioOverviewProps extends IPortfolioOverviewWebPartProps {
    context: WebPartContext;
    title: string;
    showGroupBy?: boolean;
    modalHeaderClassName?: string;
    projectInfoFilterField?: string;
    constrainMode?: ConstrainMode;
    layoutMode?: DetailsListLayoutMode;
    selectionMode?: SelectionMode;
    excelExportEnabled?: boolean;
    excelExportConfig?: any;
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
    excelExportEnabled: true,
    excelExportConfig: {
        fileName: '{0}-{1}.xlsx',
        sheetName: 'Sheet A',
        buttonLabel: 'Eksporter til Excel',
        buttonIcon: 'ExcelDocument',
    },
    viewSelectorEnabled: true,
};