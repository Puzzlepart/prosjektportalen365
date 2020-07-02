import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { IFilterItemProps } from '../FilterItem/IFilterItemProps'

export interface IFilterProps {
    column: IColumn;
    items: IFilterItemProps[];
    defaultCollapsed?: boolean;
    onFilterChange?: (column: IColumn, selectedItems: IFilterItemProps[]) => void;
}
