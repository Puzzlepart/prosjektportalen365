import * as React from 'react'
import styles from './FilterItem.module.scss'
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox'
import { IFilterItemProps } from './IFilterItemProps'

export class FilterItem extends React.PureComponent<IFilterItemProps, {}> {
    constructor(props: IFilterItemProps) {
        super(props)
        this.state = {}
    }

    public render(): React.ReactElement<IFilterItemProps> {
        return (
            <li>
                <div className={styles.filterItem}>
                    <Checkbox
                        label={this.props.name}
                        defaultChecked={this.props.selected}
                        onChange={this.props.onChanged} />
                </div>
            </li>
        )
    }
}
