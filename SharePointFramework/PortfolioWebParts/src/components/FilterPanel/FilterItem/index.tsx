import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox'
import * as React from 'react'
import styles from './FilterItem.modules.scss'
import { IFilterItemProps } from './types'

export const FilterItem: React.FunctionComponent<IFilterItemProps> = (props) => {
  return (
    <li>
      <div className={styles.root}>
        <Checkbox label={props.name} checked={props.selected} onChange={props.onChanged} />
      </div>
    </li>
  )
}
