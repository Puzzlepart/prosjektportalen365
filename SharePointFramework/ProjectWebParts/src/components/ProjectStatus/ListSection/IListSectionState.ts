import { IStatusSectionBaseState } from '../@StatusSectionBase/IStatusSectionBaseState';
import { IListSectionData } from './IListSectionData';

export interface IListSectionState extends IStatusSectionBaseState {
    isLoading: boolean;
    data?: IListSectionData; 
    error?: any;
}