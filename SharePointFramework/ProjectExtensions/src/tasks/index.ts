import { IProjectSetupData } from 'extensions/projectSetup';
import { IBaseTask } from './@BaseTask';
import { ApplyTemplate } from './ApplyTemplate';
import { CopyListData } from './CopyListData';
import { PlannerConfiguration } from './PlannerConfiguration';
import { PreTask } from './PreTask';
import { ProvisionSiteFields } from './ProvisionSiteFields';
import { SetTaxonomyFields } from './SetTaxonomyFields';
import { SetupProjectInformation } from './SetupProjectInformation';

const tasks: (new (data: IProjectSetupData) => IBaseTask)[] = [
    PreTask,
    SetupProjectInformation,
    PlannerConfiguration,
    ProvisionSiteFields,
    ApplyTemplate,
    SetTaxonomyFields,
    CopyListData,
];

/**
 * Get tasks
 * 
 * @param {IProjectSetupData} data Data
 */
export function getTasks(data: IProjectSetupData) {
    return tasks.map(ctor => new ctor(data));
}

export * from './@BaseTask';
