import  { IBaseWebPartProps } from '../baseWebPart';

export interface IProjectPhasesWebPartProps extends IBaseWebPartProps {
    phaseField: string;
    automaticReload: boolean;
    reloadTimeout: number;
    confirmPhaseChange: boolean;
    fontSize: number;
    gutter: number;
    currentPhaseViewName: boolean;
    phaseSubTextProperty: string;
}