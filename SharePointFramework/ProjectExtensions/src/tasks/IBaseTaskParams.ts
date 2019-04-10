import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { IProjectSetupApplicationCustomizerProperties } from '../extensions/projectSetup/IProjectSetupApplicationCustomizerProperties';
import IProjectSetupApplicationCustomizerData from '../extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { IPlannerPlan } from './PlannerConfiguration';

export interface IBaseTaskParams {
    context: ApplicationCustomizerContext;
    properties: IProjectSetupApplicationCustomizerProperties;
    data: IProjectSetupApplicationCustomizerData;
    entity?: any;
    groupPlans?: IPlannerPlan[];
}