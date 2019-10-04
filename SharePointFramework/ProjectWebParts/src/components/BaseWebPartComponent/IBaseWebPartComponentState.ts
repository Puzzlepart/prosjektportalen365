export interface IBaseWebPartComponentState<T> {
    /**
     * The component is loading
     */
    isLoading: boolean;

    /**
     * Data 
     */
    data?: T;

    /**
     * Error object
     */
    error?: any;

    /**
     * Is the component hidden
     */
    hidden?: boolean;
}