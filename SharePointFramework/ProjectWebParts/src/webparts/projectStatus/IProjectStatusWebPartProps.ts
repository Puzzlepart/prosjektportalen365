import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectStatusWebPartProps {
    title: string;
    reportListName: string;
    sectionsListName: string;
    reportCtId: string;
    entity: ISpEntityPortalServiceParams;
}