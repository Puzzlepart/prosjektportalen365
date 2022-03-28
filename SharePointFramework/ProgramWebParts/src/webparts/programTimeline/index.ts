import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import { ChildProject } from 'models/ChildProject'
import { ProgramTimeline } from 'components/ProgramTimeline/ProgramTimeline'
import { DataAdapter } from 'data'
import { WebPartContext } from '@microsoft/sp-webpart-base'

export interface IProgramTimelineProps extends IBaseWebPartComponentProps {
  description: string
  context: WebPartContext
  dataAdapter: DataAdapter
  childProjects: string[]
  infoText?: string
  dataSource: string
  webPartTitle: string
}

export default class ProgramTimelineWebPart extends BaseProgramWebPart<IProgramTimelineProps> {
  public childProjects: ChildProject[]

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProgramTimelineProps>(ProgramTimeline, {
      description: this.description,
      context: this.context,
      dataAdapter: this.dataAdapter,
      childProjects: this.siteIds,
      infoText: this.properties.infoText,
      dataSource: this.properties.dataSource,
      webPartTitle: this.properties.webPartTitle
    })
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0')
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: []
    }
  }
}
