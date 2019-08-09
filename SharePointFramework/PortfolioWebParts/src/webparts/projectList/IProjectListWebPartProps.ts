import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectListWebPartProps {
    phaseTermSetId: string;
    entity: ISpEntityPortalServiceParams;
    sortBy?: string;
    showAsTiles?: boolean;
    showProjectLogo?: boolean;
    showProjectOwner?: boolean;
    showProjectManager?: boolean;
}