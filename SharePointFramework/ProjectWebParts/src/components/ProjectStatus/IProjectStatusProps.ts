import { IBaseWebPartComponentProps } from '../BaseWebPartComponent';

export interface IProjectStatusProps extends IBaseWebPartComponentProps {
    /**
     * Email for the current user
     */
    currentUserEmail: string;
}
