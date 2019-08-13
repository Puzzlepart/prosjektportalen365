import * as ResourceAllocationWebPartStrings from 'ResourceAllocationWebPartStrings';

export interface IResourceAllocationProps  {
   title: string;
    dataSource: string;
   itemBgColor?: string;
   itemAbsenceBgColor?: string;
}

export const ResourceAllocationDefaultProps: Partial<IResourceAllocationProps> = {
    title: ResourceAllocationWebPartStrings.Title,
    itemBgColor: '51,153,51',
   itemAbsenceBgColor: '26,111,179',
};
