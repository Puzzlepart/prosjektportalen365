import { IBaseSectionState } from '../BaseSection';
import { IListSectionData } from './IListSectionData';

export interface IListSectionState extends IBaseSectionState {
    /**
     * Whether the component is loading
     */
    isLoading: boolean;

    /**
     * Data
     */
    data?: IListSectionData;

    /**
     * Error
     */
    error?: any;
}