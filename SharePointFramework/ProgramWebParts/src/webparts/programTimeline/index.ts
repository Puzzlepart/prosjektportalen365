import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import { ChildProject } from 'models/ChildProject'
import { ProgramTimeline } from 'components/ProgramTimeline/ProgramTimeline'
import { DataAdapter } from 'data'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import strings from 'ProgramWebPartsStrings'

export interface IProgramTimelineProps extends IBaseWebPartComponentProps {
  description: string
  context: WebPartContext
  dataAdapter: DataAdapter
  childProjects: string[]
  infoText?: string
  webPartTitle: string
  dataSourceName?: string
  configItemTitle?: string

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
      webPartTitle: this.properties.webPartTitle,
      dataSourceName: this.properties.dataSourceName,
      configItemTitle: this.properties.configItemTitle
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
      pages: [
        {
          groups: [
            {
              groupName: strings.ProjectDeliveriesGroupName,
              groupFields: [
                PropertyPaneTextField('dataSourceName', {
                  label: strings.DataSourceLabel,
                  value: 'Alle prosjektleveranser'
                }),
                PropertyPaneTextField('configItemTitle', {
                  label: strings.ConfigItemTitleFieldLabel,
                  description: strings.ConfigItemTitleFieldDescription,
                  value: 'Prosjektleveranse'
                }),
              ]
            }
          ]
        }
      ]
    }
  }
}
