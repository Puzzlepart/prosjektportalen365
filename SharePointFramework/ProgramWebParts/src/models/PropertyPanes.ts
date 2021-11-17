import { DisplayMode } from "@microsoft/sp-core-library";

export interface IAggregatedPortfolioPropertyPane {
    dataSource: string;
    showExcelExportButton: boolean;
    showCommandBar: boolean;
    showSearchBox: boolean;
    columns?: Array<{key: string, fieldName: string, name: string, minWidth:number,maxWidth:number, isMultiline:boolean, isResizable:boolean}>
    displayMode: DisplayMode;
}