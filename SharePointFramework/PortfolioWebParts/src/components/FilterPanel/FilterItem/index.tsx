import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox'
import React, { PureComponent, ReactElement } from 'react'
import styles from './FilterItem.module.scss'
import { IFilterItemProps } from './IFilterItemProps'

// eslint-disable-next-line @typescript-eslint/ban-types
export class FilterItem extends PureComponent<IFilterItemProps, {}> {
  constructor(props: IFilterItemProps) {
    super(props)
    this.state = {}
  }

  public render(): ReactElement<IFilterItemProps> {
    return (
      <li>
        <div className={styles.filterItem}>
          <Checkbox
            label={this.props.name}
            defaultChecked={this.props.selected}
            onChange={this.props.onChanged}
          />
        </div>
      </li>
    )
  }
}
