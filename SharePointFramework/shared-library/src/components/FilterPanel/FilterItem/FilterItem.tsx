import { Checkbox } from '@fluentui/react/lib/Checkbox';
import React, { FC } from 'react';
import styles from './FilterItem.module.scss';
import { IFilterItemProps } from './types';


export const FilterItem: FC<IFilterItemProps> = (props) => {
  return (
    <li>
      <div className={styles.root}>
        <Checkbox label={props.name} checked={props.selected} onChange={props.onChanged} />
      </div>
    </li>
  );
};
