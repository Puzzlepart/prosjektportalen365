import { IPanelProps } from 'office-ui-fabric-react/lib/Panel';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IFilterProps } from './Filter/IFilterProps';
import { IFilterItemProps } from './FilterItem/IFilterItemProps';

export interface IFilterPanelProps extends IPanelProps {
    /**
     * Filters
     */
    filters: IFilterProps[];

    /**
     * On filter change function
     */
    onFilterChange: (column: IColumn, selectedItems: IFilterItemProps[]) => void;

    /**
     * Id for the layer host
     */
    layerHostId?: string;
}
