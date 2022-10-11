import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { ProjectTimeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline'
import strings from 'ProgramWebPartsStrings'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramTimelineWebPartProps } from './types'

export default class ProgramTimelineWebPart extends BaseProgramWebPart<IProgramTimelineWebPartProps> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    render(
      <>
        <ProjectTimeline
          title={this.properties.title}
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
    unmountComponentAtNode(this.domElement)
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
