import { IBaseComponentProps } from '../IBaseComponentProps';
import * as moment from 'moment';

export interface IResourceAllocationProps extends IBaseComponentProps {
   /**
    * Data source
    */
   dataSource: string;

   /**
    * Background color for item
    */
   itemBgColor?: string;

   /**
    * Background color for absence items
    */
   itemAbsenceBgColor?: string;

   /**
    * Default time start
    */
   defaultTimeStart?: [number,  moment.unitOfTime.DurationConstructor];

   /**
    * Default time end
    */
   defaultTimeEnd?: [number, moment.unitOfTime.DurationConstructor];

   /**
    * Select properties
    */
   selectProperties?: string[];
}