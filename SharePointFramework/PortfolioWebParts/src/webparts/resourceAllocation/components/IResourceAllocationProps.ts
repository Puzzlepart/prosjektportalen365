import { IResourceAllocationWebPartProps } from '../IResourceAllocationWebPartProps';
import * as strings from 'ResourceAllocationWebPartStrings';

export interface IResourceAllocationProps extends IResourceAllocationWebPartProps {}

export const ResourceAllocationDefaultProps: Partial<IResourceAllocationProps> = {
    title: strings.Title,
};
