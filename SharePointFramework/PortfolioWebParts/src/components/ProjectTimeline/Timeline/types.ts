import { ITimelineItem, ITimelineGroup } from '../../../interfaces'
import moment from 'moment'
import { IColumn } from '@fluentui/react'
import { IFilterItemProps, IFilterProps } from '../../FilterPanel'

export interface ITimelineProps {
  defaultTimeStart?: [number, moment.unitOfTime.DurationConstructor];
  defaultTimeEnd?: [number, moment.unitOfTime.DurationConstructor];
  groups: ITimelineGroup[];
  items: ITimelineItem[];
  filters: IFilterProps[];
  onFilterChange: (column: IColumn, selectedItems: IFilterItemProps[]) => void;
  onGroupChange: (group: string) => void;
  isGroupByEnabled?: boolean;
  infoText?: string;
  title?: string;
}
