import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ProjectColumnConfigDictionary } from './ProjectColumnConfig';
import { IPortfolioOverviewColumnSpItem } from 'interfaces';

export class PortfolioOverviewColumn implements IColumn {
    public key: string;
    public fieldName: string;
    public name: string;
    public minWidth: number;
    public id?: number;
    public sortOrder?: number;
    public internalName?: string;
    public showFieldProjectStatus?: boolean;
    public showFieldFrontpage?: boolean;
    public showFieldPortfolio?: boolean;
    public dataType?: string;
    public isMultiline?: boolean;
    public isRefinable?: boolean;
    public isGroupable?: boolean;
    public isResizable?: boolean;
    public isSorted?: boolean;
    public isSortedDescending?: boolean;
    public config?: ProjectColumnConfigDictionary;

    constructor(item: IPortfolioOverviewColumnSpItem) {
        this.id = item.Id;
        this.fieldName = item.GtManagedProperty;
        this.key = item.GtManagedProperty;
        this.name = item.Title;
        this.sortOrder = item.GtSortOrder;
        this.internalName = item.GtInternalName;
        this.dataType = item.GtFieldDataType.toLowerCase();
        this.isMultiline = this.dataType === 'note';
        this.showFieldProjectStatus = item.GtShowFieldProjectStatus;
        this.showFieldFrontpage = item.GtShowFieldFrontpage;
        this.showFieldPortfolio = item.GtShowFieldPortfolio;
        this.isRefinable = item.GtIsRefinable;
        this.isGroupable = item.GtIsGroupable;
        this.isResizable = true;
        this.minWidth = item.GtColMinWidth || 100;
    }
}
