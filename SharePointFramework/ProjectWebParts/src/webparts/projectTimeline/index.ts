import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import '@pnp/polyfill-ie11'
import {
  IProjectTimelineProps,
  ProjectTimeline
} from 'components/ProjectTimeline'
import '@fluentui/react/dist/css/fabric.min.css'
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart'

import * as strings from 'ProjectWebPartsStrings'
import { format } from '@fluentui/react'

export default class ProjectTimelineWebPart extends BaseProjectWebPart<IProjectTimelineProps> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectTimelineProps>(ProjectTimeline)
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const propertesWithDefaults = {
      ...ProjectTimeline.defaultProps,
      ...this.properties
    }
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.ProjecttimelineGroupName,
              groupFields: [
                PropertyPaneTextField('listName', {
                  label: strings.ListNameFieldLabel,
                  value: 'Tidslinjeinnhold'
                }),
                PropertyPaneToggle('showTimeline', {
                  label: strings.ShowTimelineLabel
                }),
                this.properties.showTimeline &&
                  PropertyPaneDropdown('defaultTimeframeStart', {
                    label: strings.DefaultTimeframeStartLabel,
                    selectedKey: propertesWithDefaults.defaultTimeframeStart,
                    options: [
                      [2, 'months'],
                      [4, 'months'],
                      [6, 'months'],
                      [8, 'months'],
                      [10, 'months'],
                      [12, 'months']
                    ].map((val) => ({
                      key: val.toString(),
                      text: format(strings.DefaultTimeframeStartValue, val[0])
                    }))
                  }),
                this.properties.showTimeline &&
                  PropertyPaneDropdown('defaultTimeframeEnd', {
                    label: strings.DefaultTimeframeEndLabel,
                    selectedKey: propertesWithDefaults.defaultTimeframeEnd,
                    options: [
                      [2, 'months'],
                      [4, 'months'],
                      [6, 'months'],
                      [8, 'months'],
                      [10, 'months'],
                      [12, 'months']
                    ].map((val) => ({
                      key: val.toString(),
                      text: format(strings.DefaultTimeframeEndValue, val[0])
                    }))
                  }),
                this.properties.showTimeline &&
                  PropertyPaneDropdown('defaultGroupBy', {
                    label: strings.DefaultGroupByLabel,
                    selectedKey: propertesWithDefaults.defaultGroupBy,
                    options: [
                      {
                        key: strings.ProjectLabel,
                        text: strings.ProjectLabel
                      },
                      {
                        key: strings.CategoryFieldLabel,
                        text: strings.CategoryFieldLabel
                      },
                      {
                        key: strings.TypeLabel,
                        text: strings.TypeLabel
                      }
                    ]
                  }),
                PropertyPaneToggle('showTimelineList', {
                  label: strings.ShowTimelineListLabel
                }),
                propertesWithDefaults.showTimelineList &&
                  PropertyPaneToggle('showTimelineListCommands', {
                    label: strings.ShowTimelineListCommandsLabel
                  })
              ].filter(Boolean)
            },
            {
              groupName: strings.ProjectDeliveriesGroupName,
              groupFields: [
                PropertyPaneToggle('showProjectDeliveries', {
                  label: strings.ShowProjectDeliveriesLabel
                }),
                PropertyPaneTextField('projectDeliveriesListName', {
                  label: strings.ListNameFieldLabel,
                  value: 'Prosjektleveranser'
                }),
                PropertyPaneTextField('configItemTitle', {
                  label: strings.ConfigItemTitleFieldLabel,
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
