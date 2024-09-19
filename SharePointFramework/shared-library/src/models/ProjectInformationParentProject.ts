import { bundleIcon, BoxMultipleFilled, BoxMultipleRegular } from '@fluentui/react-icons'
import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'
import { IWeb } from '@pnp/sp/webs'

const Icons = {
  BoxMultiple: bundleIcon(BoxMultipleFilled, BoxMultipleRegular)
}

/**
 * Project information parent project model. Used to display
 * parent projects in the component.
 */
export class ProjectInformationParentProject {
  public title: string
  public url: string
  public childProjects: any[]
  public icon: FluentIcon

  constructor(spItem: Record<string, any>, public web: IWeb) {
    this.title = spItem.Title
    this.url = spItem.GtSiteUrl
    this.childProjects = (JSON.parse(spItem.GtChildProjects ?? []) as any[]).map((i) => i.SPWebURL)
    if (spItem.GtIsParentProject) this.icon = Icons.BoxMultiple
    else this.icon = Icons.BoxMultiple
  }
}
