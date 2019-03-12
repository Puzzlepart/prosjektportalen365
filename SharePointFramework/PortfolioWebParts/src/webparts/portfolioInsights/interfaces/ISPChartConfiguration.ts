export interface ISPChartConfiguration {
    ContentTypeId: string;
    Title: string;
    GtPiSubTitle: string;
    GtPiDataSourceLookup: { Id: number, GtSearchQuery: string };
    GtPiFieldsId: number[];
    GtPiCategoryFieldId: number;
    GtPiWidthSm: number;
    GtPiWidthMd: number;
    GtPiWidthLg: number;
    GtPiWidthXl: number;
    GtPiWidthXxl: number;
    GtPiWidthXxxl: number;
}