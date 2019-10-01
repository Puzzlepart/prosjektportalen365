import { IBaseWebPartComponentProps } from '../BaseWebPartComponent';

export interface IProjectStatusProps extends IBaseWebPartComponentProps {
    /**
     * Email for the current user
     */
    currentUserEmail: string;

    /**
     * List name for reports
     */
    reportListName: string;

    /**
     * List name for sections
     */
    sectionsListName: string;

    /**
     * Content type id for report
     */
    reportCtId: string;
}
