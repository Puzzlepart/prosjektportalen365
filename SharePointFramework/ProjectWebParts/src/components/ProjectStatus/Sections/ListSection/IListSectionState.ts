import { IBaseSectionState } from '../BaseSection'

export interface IListSectionState<T> extends IBaseSectionState {
    /**
     * Whether the component is loading
     */
    isLoading: boolean;

    /**
     * Data
     */
    data?: T;

    /**
     * Error
     */
    error?: any;
}