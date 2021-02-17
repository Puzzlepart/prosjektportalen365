import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { IPanelProps } from 'office-ui-fabric-react/lib/Panel'

export interface IAddColumnPanelProps extends IPanelProps {
    onAddColumn: (column: IColumn) => void
}
