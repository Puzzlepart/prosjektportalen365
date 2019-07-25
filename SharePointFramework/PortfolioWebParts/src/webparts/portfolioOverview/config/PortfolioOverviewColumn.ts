import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ProjectStatusConfig, ProjectStatusConfigDictionary } from './ProjectStatusConfig';

export interface IPortfolioOverviewColumnSpItem {
    Id?: number;
    Title?: string;
    GtSortOrder?: number;
    GtInternalName?: string;
    GtManagedProperty?: string;
    GtShowFieldProjectStatus?: boolean;
    GtShowFieldFrontpage?: boolean;
    GtShowFieldPortfolio?: boolean;
    GtFieldDataType?: string;
    GtColMinWidth?: number;
    GtIsRefinable?: boolean;
    GtIsGroupable?: boolean;
}

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
    public isRefinable?: boolean;
    public isGroupable?: boolean;
    public isResizable?: boolean;
    public statusConfig?: ProjectStatusConfigDictionary;

    constructor(item: IPortfolioOverviewColumnSpItem) {
        this.id = item.Id;
        this.fieldName = item.GtManagedProperty;
        this.key = item.GtManagedProperty;
        this.name = item.Title;
        this.sortOrder = item.GtSortOrder;
        this.internalName = item.GtInternalName;
        this.showFieldProjectStatus = item.GtShowFieldProjectStatus;
        this.showFieldFrontpage = item.GtShowFieldFrontpage;
        this.showFieldPortfolio = item.GtShowFieldPortfolio;
        this.dataType = item.GtFieldDataType;
        this.isRefinable = item.GtIsRefinable;
        this.isGroupable = item.GtIsGroupable;
        this.isResizable = true;
        this.minWidth = item.GtColMinWidth || 100;
    }
}
