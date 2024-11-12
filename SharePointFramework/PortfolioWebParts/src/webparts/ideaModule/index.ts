/* eslint-disable quotes */
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import { IIdeaModuleProps, IdeaModule } from 'components/IdeaModule'

export default class IdeaModuleWebPart extends BasePortfolioWebPart<IIdeaModuleProps> {
  public render(): void {
    this.renderComponent<IIdeaModuleProps>(IdeaModule)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: 'Idémodul'
          },
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('configurationList', {
                  label: 'Konfigurasjonsliste',
                  description: 'Navn på Idékonfigurasjonsliste'
                }),
                PropertyPaneTextField('configuration', {
                  label: 'Konfigurasjonsnavn',
                  description: 'Navn på konfigurasjonen som skal brukes'
                }),
                PropertyPaneTextField('hiddenRegFields', {
                  label: 'Skjulte felter (registrering)',
                  description: 'Felt som skal skjules fra idémodulen (Idéregistrering)',
                  multiline: true,
                  resizable: true,
                  rows: 1
                }),
                PropertyPaneTextField('hiddenProcFields', {
                  label: 'Skjulte felter (behandling)',
                  description: 'Felt som skal skjules fra idémodulen (Idébehandling)',
                  multiline: true,
                  resizable: true,
                  rows: 6
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
