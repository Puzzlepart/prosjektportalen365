import { Version } from '@microsoft/sp-core-library'
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { DataAdapter } from 'data'
import { ProjectTimeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline'
import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import strings from 'ProgramWebPartsStrings'
import React from 'react'
import * as ReactDom from 'react-dom'
import { IChildProject } from 'types/IChildProject'
import { BaseProgramWebPart } from '../baseProgramWebPart'

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
  public childProjects: IChildProject[]

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    ReactDom.render(
      <>
        <ProjectTimeline
          title={this.webPartTitle ?? this.properties.webPartTitle}
          dataAdapter={this.dataAdapter}
          pageContext={this.context.pageContext}
          infoText={this.properties.infoText}
          dataSourceName={this.properties.dataSourceName}
          configItemTitle={this.properties.configItemTitle}
        />
      </>,
      this.domElement
    )
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
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
