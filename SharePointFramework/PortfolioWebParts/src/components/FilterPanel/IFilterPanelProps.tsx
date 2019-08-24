import { IPanelProps } from 'office-ui-fabric-react/lib/Panel';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IFilterProps } from './Filter/IFilterProps';
import { IFilterItemProps } from './FilterItem/IFilterItemProps';

export interface IFilterPanelProps extends IPanelProps {
    /**
     * @todo describe property
     */
    filters: IFilterProps[];

    /**
     * @todo describe property
     */
    onFilterChange: (column: IColumn, selectedItems: IFilterItemProps[]) => void;

    /**
     * @todo describe property
     */
    layerHostId?: string;
}
