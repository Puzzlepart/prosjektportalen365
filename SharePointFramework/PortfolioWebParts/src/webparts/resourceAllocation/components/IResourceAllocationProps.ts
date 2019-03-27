import { IResourceAllocationWebPartProps } from '../IResourceAllocationWebPartProps';
import * as strings from 'ResourceAllocationWebPartStrings';

export interface IResourceAllocationProps extends IResourceAllocationWebPartProps {
   itemBgColor?: string;
   itemAbsenceBgColor?: string;
}

export const ResourceAllocationDefaultProps: Partial<IResourceAllocationProps> = {
    title: strings.Title,
    itemBgColor: '51,153,51',
   itemAbsenceBgColor: '26,111,179',
};
