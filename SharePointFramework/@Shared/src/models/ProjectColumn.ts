import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ProjectColumnConfigDictionary, ProjectColumnConfig } from './ProjectColumnConfig';
import { SearchValueType } from '../types/SearchValueType';

export class SPProjectColumnItem {
    // tslint:disable-next-line:naming-convention
    public Id: number = 0;
    // tslint:disable-next-line:naming-convention
    public Title: string = '';
    // tslint:disable-next-line:naming-convention
    public GtSortOrder: number = 0;
    // tslint:disable-next-line:naming-convention
    public GtInternalName: string = '';
    // tslint:disable-next-line:naming-convention
    public GtManagedProperty: string = '';
    // tslint:disable-next-line:naming-convention
    public GtShowFieldProjectStatus: boolean = false;
    // tslint:disable-next-line:naming-convention
    public GtShowFieldFrontpage: boolean = false;
    // tslint:disable-next-line:naming-convention
    public GtShowFieldPortfolio: boolean = false;
    // tslint:disable-next-line:naming-convention
    public GtFieldDataType: string = '';
    // tslint:disable-next-line:naming-convention
    public GtColMinWidth: number = 0;
    // tslint:disable-next-line:naming-convention
    public GtIsRefinable: boolean = false;
    // tslint:disable-next-line:naming-convention
    public GtIsGroupable: boolean = false;
}


export class ProjectColumn implements IColumn {
    public key: string;
    public fieldName: string;
    public name: string;
    public minWidth: number;
    public id?: number;
    public sortOrder?: number;
    public internalName?: string;
    public iconName?: string;
    public showFieldProjectStatus?: boolean;
    public showFieldFrontpage?: boolean;
    public showFieldPortfolio?: boolean;
    public dataType?: string;
    public searchType?: SearchValueType;
    public isMultiline?: boolean;
    public isRefinable?: boolean;
    public isGroupable?: boolean;
    public isResizable?: boolean;
    public isSorted?: boolean;
    public isSortedDescending?: boolean;
    public config?: ProjectColumnConfigDictionary;
    public onColumnClick: any;

    constructor(item?: SPProjectColumnItem) {
        if (item) {
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
            this.searchType = this._getSearchType(this.fieldName.toLowerCase());
        }
    }

    /**
     * 
     * @param key 
     * @param fieldName 
     * @param name 
     * @param iconName 
     * @param onColumnClick 
     * @param minWidth 
     */
    public create(key: string, fieldName: string, name: string, iconName: string, onColumnClick: any, minWidth: number): ProjectColumn {
        this.key = key;
        this.fieldName = fieldName;
        this.name = name;
        this.iconName = iconName;
        this.onColumnClick = onColumnClick;
        this.minWidth = minWidth;
        return this;
    }

    public configure(config: ProjectColumnConfig[]): ProjectColumn {
        this.config = config
            .filter(col => col.columnId === this.id)
            .reduce((obj, { value, color, iconName }) => ({ ...obj, [value]: { color, iconName } }), {}) as ProjectColumnConfigDictionary;
        return this;
    }

    /**
     * Get search type from field name
     * 
     * @param {string} fieldName Field name
     */
    private _getSearchType?(fieldName: string): SearchValueType {
        if (fieldName.indexOf('owsdate') !== -1) {
            return SearchValueType.OWSDATE;
        }
        if (fieldName.indexOf('owsuser') !== -1) {
            return SearchValueType.OWSUSER;
        }
        if (fieldName.indexOf('owstaxid') !== -1) {
            return SearchValueType.OWSTAXID;
        }
        if (fieldName.indexOf('owscurr') !== -1) {
            return SearchValueType.OWSCURR;
        }
        if (fieldName.indexOf('owsmtxt') !== -1) {
            return SearchValueType.OWSMTXT;
        }
        return SearchValueType.OWSTEXT;
    }
}
