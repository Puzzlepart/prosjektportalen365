import { SpEntityPortalService } from 'sp-entityportal-service'

export interface IProjectDataServiceConfiguration {
  webUrl: string
  spfxContext: any
  siteId: string
  entityService: SpEntityPortalService
  propertiesListName: string
}
