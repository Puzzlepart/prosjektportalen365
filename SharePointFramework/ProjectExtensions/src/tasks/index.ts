import PlannerConfiguration from './PlannerConfiguration';
import SetupProjectInformation from './SetupProjectInformation';
import ProvisionSiteFields from './ProvisionSiteFields';
import ApplyTemplate from './ApplyTemplate';
import CopyListData from './CopyListData';
import SetTaxonomyFields from './SetTaxonomyFields';
import { BaseTask } from './BaseTask';
export * from './BaseTask';

const tasks: BaseTask[] = [
    new SetupProjectInformation(),
    new PlannerConfiguration(),
    new ProvisionSiteFields(),
    new ApplyTemplate(),
    new SetTaxonomyFields(),
    new CopyListData(),
];

export default tasks;
export { IBaseTaskParams } from './IBaseTaskParams';