import { Version } from '@microsoft/sp-core-library'
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { ProjectTimeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline'
import strings from 'ProgramWebPartsStrings'
import React from 'react'
import * as ReactDom from 'react-dom'
import { IChildProject } from 'types/IChildProject'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramTimelineWebPartProps } from './types'

export default class ProgramTimelineWebPart extends BaseProgramWebPart<IProgramTimelineWebPartProps> {
  public childProjects: IChildProject[]

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    ReactDom.render(
      <>
        <ProjectTimeline
          title={this.pageTitle ?? this.properties.title}
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
