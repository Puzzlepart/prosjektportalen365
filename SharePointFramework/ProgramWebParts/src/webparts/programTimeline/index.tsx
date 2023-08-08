import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import {
  ProjectTimeline,
  IProjectTimelineProps
} from 'pp365-shared-library/lib/components/ProjectTimeline'
import strings from 'ProgramWebPartsStrings'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'

export default class ProgramTimelineWebPart extends BaseProgramWebPart<IProjectTimelineProps> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    render(
      <>
        <ProjectTimeline
          title={this.properties.title}
          dataAdapter={this._dataAdapter}
          pageContext={this.context.pageContext as any}
          dataSourceName={this.properties.dataSourceName}
          configItemTitle={this.properties.configItemTitle}
          infoText={strings.ProgramTimelineInfoText}
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
