import _ from 'lodash'
import { IRenderItemColumnProps } from 'pp365-shared-library'
import { formatDate, getStatusPageSeriesKey } from 'pp365-shared-library'

export interface IStatusColumnProps extends IRenderItemColumnProps {
  status?: ProjectStatusModel
  statusReportListName?: string
  columnConfigListName?: string
  statusSectionsListName?: string
  animation?: {
    delay?: number
    transitionDuration?: number
  }
  tooltip?: {
    animation: IStatusColumnProps['animation']
  }
}

interface IStatusSectionItem {
  GtSecFieldName: string
  GtSecIcon: string
}

class ProjectStatusSection {
  constructor(
    public fieldName: string,
    public name: string,
    public iconName: string,
    public value: string,
    public comment: string,
    public color: string
  ) {}
}

export class ProjectStatusModel {
  public siteId: string

  /**
   * Status page series key for the report (`GtStatusPageId` normalized to
   * lowercase). An empty string means the report belongs to the project's
   * default status page series.
   */
  public statusPageId: string

  constructor(
    private item: Record<string, any>,
    private columnConfigurations: {
      [key: string]: { name: string; iconName: string; colors: any }
    },
    private statusSections: Array<IStatusSectionItem>
  ) {
    this.siteId = this.item.GtSiteId
    this.statusPageId = getStatusPageSeriesKey(this.item.GtStatusPageId)
  }

  /**
   * Get the SharePoint item for the project status
   */
  public getItem(): Record<string, any> {
    return this.item
  }

  public get created(): string {
    return formatDate(this.item.Created)
  }

  public get sections(): Array<ProjectStatusSection> {
    const statusKeys = _.filter(
      Object.keys(this.item),
      (key) =>
        (_.startsWith(key, 'GtStatus') || _.startsWith(key, 'GtOverallStatus')) &&
        !_.endsWith(key, 'Comment') &&
        !_.startsWith(key, 'GtStatusPage')
    )
    return statusKeys.map((key) => {
      const name = _.capitalize(this.columnConfigurations[key]?.name.split(' ')[1])
      const iconName = (_.find(this.statusSections, (s) => s.GtSecFieldName === key) || {})
        .GtSecIcon
      const value = this.item[key]
      const comment = this.item[`${key}Comment`]
      const color = this.columnConfigurations[key]?.colors[value]
      return new ProjectStatusSection(key, name, iconName, value, comment, color)
    })
  }
}
