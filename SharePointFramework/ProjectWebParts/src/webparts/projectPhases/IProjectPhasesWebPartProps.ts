import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectPhasesWebPartProps {
    phaseField: string;
    automaticReload: boolean;
    reloadTimeout: number;
    confirmPhaseChange: boolean;
    currentPhaseViewName: boolean;
    phaseSubTextProperty: string;
    entity: ISpEntityPortalServiceParams;
}