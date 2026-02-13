import { bundleIcon, CubeFilled, CubeRegular } from '@fluentui/react-icons'
import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'
import { IWeb } from '@pnp/sp/webs'

const Icons = {
  Cube: bundleIcon(CubeFilled, CubeRegular)
}

/**
 * Project information child project model. Used to display
 * child projects in the component.
 */
export class ProjectInformationChildProject {
  public title: string
  public url: string
  public siteId: string
  public icon: FluentIcon

  constructor(spItem: Record<string, any>, public web: IWeb) {
    this.title = spItem.Title
    this.url = spItem.GtSiteUrl
    this.siteId = spItem.GtSiteId
    this.icon = Icons.Cube
  }
}
