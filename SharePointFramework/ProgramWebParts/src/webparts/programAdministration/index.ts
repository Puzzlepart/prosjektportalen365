import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { ProgramAdministration } from 'components/ProgramAdministration'
import { IProgramAdministrationProps } from 'components/ProgramAdministration/types'
import { unmountComponentAtNode } from 'react-dom'
import { BaseProgramWebPart } from 'webparts/baseProgramWebPart'

export default class ProgramAdministrationWebPart extends BaseProgramWebPart<IProgramAdministrationProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProgramAdministrationProps>(ProgramAdministration, {
      title: this.properties.title,
      spfxContext: this.context,
      dataAdapter: this.dataAdapter
    })
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
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Tittel'
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
