import { IProjectSetupData } from 'extensions/projectSetup'
import { IBaseTask } from './@BaseTask'
import { ApplyTemplate } from './ApplyTemplate'
import { CopyListData } from './CopyListData'
import { CustomActions } from './CustomActions'
import { PreTask } from './PreTask'
import { ProvisionSiteFields } from './ProvisionSiteFields'
import { SetTaxonomyFields } from './SetTaxonomyFields'
import { SetupProjectInformation } from './SetupProjectInformation'
import { ShieldProjectData } from './ShieldProjectData'
import { SitePermissions } from './SitePermissions'
import { Hooks } from './Hooks'

const tasks: (new (data: IProjectSetupData) => IBaseTask)[] = [
  PreTask,
  SitePermissions,
  SetupProjectInformation,
  ProvisionSiteFields,
  ApplyTemplate,
  ShieldProjectData,
  SetTaxonomyFields,
  CopyListData,
  CustomActions,
  Hooks
]

/** Creates setup tasks in dependency order, sharing the selected setup data. */
export function getTasks(data: IProjectSetupData) {
  return tasks.map((ctor) => new ctor(data))
}

export * from './@BaseTask'
