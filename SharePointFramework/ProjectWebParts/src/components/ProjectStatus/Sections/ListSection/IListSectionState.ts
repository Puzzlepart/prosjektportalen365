import { IBaseSectionState } from '../BaseSection';
import { IListSectionData } from './IListSectionData';

export interface IListSectionState extends IBaseSectionState {
    /**
     * @todo Describe property
     */
    isLoading: boolean;

    /**
     * @todo Describe property
     */
    data?: IListSectionData;

    /**
     * @todo Describe property
     */
    error?: any;
}