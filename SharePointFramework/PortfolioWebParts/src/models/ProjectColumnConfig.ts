import { IProjectColumnConfigSpItem } from "interfaces";

export type ProjectColumnConfigDictionary = { [key: string]: { color: string, iconName: string } };

export class ProjectColumnConfig  {
    public id?: number;
    public columnId?: number;
    public value?: string;
    public color?: string;
    public iconName?: string;

    constructor(item: IProjectColumnConfigSpItem) {
        this.id = item.Id;
        this.columnId = item.GtPortfolioColumnId;
        this.value = item.GtPortfolioColumnValue;
        this.color = item.GtPortfolioColumnColor;
        this.iconName = item.GtPortfolioColumnIconName;
    }
}
