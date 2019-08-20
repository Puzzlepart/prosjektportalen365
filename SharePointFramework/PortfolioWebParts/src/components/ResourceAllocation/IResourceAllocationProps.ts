import { IBaseComponentProps } from '../';

export interface IResourceAllocationProps extends IBaseComponentProps {
   dataSource: string;
   itemBgColor?: string;
   itemAbsenceBgColor?: string;
}

export const ResourceAllocationDefaultProps: Partial<IResourceAllocationProps> = {
   itemBgColor: '51,153,51',
   itemAbsenceBgColor: '26,111,179',
};
