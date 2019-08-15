export interface IResourceAllocationProps {
   title: string;
   dataSource: string;
   itemBgColor?: string;
   itemAbsenceBgColor?: string;
}

export const ResourceAllocationDefaultProps: Partial<IResourceAllocationProps> = {
   itemBgColor: '51,153,51',
   itemAbsenceBgColor: '26,111,179',
};
