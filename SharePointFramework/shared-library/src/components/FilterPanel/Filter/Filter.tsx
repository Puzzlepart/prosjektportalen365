import { Icon } from '@fluentui/react/lib/Icon';
import * as React from 'react';
import { Component } from 'react';
import { FilterItem } from '../FilterItem/FilterItem';
import { IFilterItemProps } from '../FilterItem/types';
import styles from './Filter.module.scss';
import { IFilterProps, IFilterState } from './types';


export class Filter extends Component<IFilterProps, IFilterState> {
  constructor(props: IFilterProps) {
    super(props);
    this.state = { isCollapsed: props.defaultCollapsed, items: props.items };
  }

  public render(): React.ReactElement<IFilterProps> {
    return (
      <div className={styles.root}>
        <div className={styles.filterSectionHeader} onClick={this._onToggleSectionContent}>
          <span className={styles.titleText}>{this.props.column.name}</span>
          <span className={styles.titleIcon}>
            <Icon iconName={this.state.isCollapsed ? 'ChevronUp' : 'ChevronDown'} />
          </span>
        </div>
        <div hidden={this.state.isCollapsed}>
          <ul className={styles.filterSectionContent}>{this._renderItems()}</ul>
        </div>
      </div>
    );
  }

  /**
   * On toggle section content
   */
  private _onToggleSectionContent = () => {
    this.setState((prevState: IFilterState) => ({ isCollapsed: !prevState.isCollapsed }));
  };

  /**
   * Render filter items
   */
  private _renderItems() {
    return this.state.items.map((props, idx) => (
      <FilterItem
        key={idx}
        {...props}
        onChanged={(_event, checked) => this._onChanged(props, checked)} />
    ));
  }

  /**
   * On changed
   *
   * @param item Item that was changed
   * @param checked Item checked
   */
  private _onChanged = (item: IFilterItemProps, checked: boolean) => {
    this.setState(
      (prevState) => {
        const items = prevState.items.map((i) => {
          if (i.value === item.value) {
            return { ...i, selected: checked };
          }
          return i;
        });
        return { items };
      },
      () => {
        const selectedItems = this.state.items.filter((i) => i.selected);
        this.props.onFilterChange(this.props.column, selectedItems);
      }
    );
  };
}
