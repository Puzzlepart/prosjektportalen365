import { IBaseComponentProps } from '../IBaseComponentProps';

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
}