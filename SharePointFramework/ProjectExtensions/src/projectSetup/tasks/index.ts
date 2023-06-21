import { IProjectSetupData } from 'projectSetup'
import { IBaseTask } from './@BaseTask'
import { ApplyTemplate } from './ApplyTemplate'
import { CopyListData } from './CopyListData'
import { CustomActions } from './CustomActions'
import { Hooks } from './Hooks'
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
  CustomActions,
  Hooks
]

/**
 * Get tasks to run for project setup.
 *
 * @param data Data to initialize tasks with.
 */
export function getTasks(data: IProjectSetupData) {
  return tasks.map((ctor) => new ctor(data))
}

export * from './@BaseTask'
