import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectInformationModalProps {
    title: string;
    siteAbsoluteUrl: string;
    entity: ISpEntityPortalServiceParams;
    siteId: string;
    filterField: string;
}
