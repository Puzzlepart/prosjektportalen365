import PlannerConfiguration from './PlannerConfiguration';
import SetupProjectInformation from './SetupProjectInformation';
import ApplyTemplate from './ApplyTemplate';
import CopyListData from './CopyListData';
import SetTaxonomyFields from './SetTaxonomyFields';
import { BaseTask } from './BaseTask';
import { IBaseTaskParams } from './IBaseTaskParams';
export * from './BaseTask';

const Tasks: BaseTask[] = [
    new SetupProjectInformation(),
    new PlannerConfiguration(),
    new ApplyTemplate(),
    new SetTaxonomyFields(),
    new CopyListData(),
];
export { Tasks, IBaseTaskParams };