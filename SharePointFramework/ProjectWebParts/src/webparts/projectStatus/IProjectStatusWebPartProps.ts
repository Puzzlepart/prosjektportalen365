import  { IBaseWebPartProps } from '../baseWebPart';

export interface IProjectStatusWebPartProps extends IBaseWebPartProps {
    reportListName: string;
    sectionsListName: string;
    reportCtId: string;
}