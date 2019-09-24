import { default as PreTask } from './PreTask';
import { default as PlannerConfiguration } from './PlannerConfiguration';
import { default as SetupProjectInformation } from './SetupProjectInformation';
import { default as ProvisionSiteFields } from './ProvisionSiteFields';
import { default as ApplyTemplate } from './ApplyTemplate';
import { default as CopyListData } from './CopyListData';
import { default as SetTaxonomyFields } from './SetTaxonomyFields';
import { BaseTask } from './BaseTask';
export * from './BaseTask';

const tasks: BaseTask[] = [
    PreTask,
    SetupProjectInformation,
    PlannerConfiguration,
    ProvisionSiteFields,
    ApplyTemplate,
    SetTaxonomyFields,
    CopyListData,
];

export default tasks;
export { IBaseTaskParams } from './IBaseTaskParams';