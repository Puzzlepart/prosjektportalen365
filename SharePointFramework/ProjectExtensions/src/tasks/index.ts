import { IProjectSetupApplicationCustomizerData } from 'extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { ApplyTemplate } from './ApplyTemplate';
import { CopyListData } from './CopyListData';
import { PlannerConfiguration } from './PlannerConfiguration';
import { PreTask } from './PreTask';
import { ProvisionSiteFields } from './ProvisionSiteFields';
import { SetTaxonomyFields } from './SetTaxonomyFields';
import { SetupProjectInformation } from './SetupProjectInformation';
import { IBaseTask } from './@BaseTask';

const tasks: (new (data: IProjectSetupApplicationCustomizerData) => IBaseTask)[] = [
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
 * @param {IProjectSetupApplicationCustomizerData} data Data
 */
export function getTasks(data: IProjectSetupApplicationCustomizerData) {
    return tasks.map(ctor => new ctor(data));
}

export * from './@BaseTask';