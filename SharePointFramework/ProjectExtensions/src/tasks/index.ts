import { IProjectSetupData } from 'extensions/projectSetup'
import { IBaseTask } from './@BaseTask'
import { ApplyTemplate } from './ApplyTemplate'
import { CopyListData } from './CopyListData'
import { PreTask } from './PreTask'
import { ProvisionSiteFields } from './ProvisionSiteFields'
import { SetTaxonomyFields } from './SetTaxonomyFields'
import { SetupProjectInformation } from './SetupProjectInformation'
import { SitePermissions } from './SitePermissions'

const tasks: (new (data: IProjectSetupData) => IBaseTask)[] = [
    PreTask,
    SitePermissions,
    SetupProjectInformation,
    ProvisionSiteFields,
    ApplyTemplate,
    SetTaxonomyFields,
    CopyListData,
]

/**
 * Get tasks
 * 
 * @param {IProjectSetupData} data Data
 */
export function getTasks(data: IProjectSetupData) {
    return tasks.map(ctor => new ctor(data))
}

export * from './@BaseTask'

