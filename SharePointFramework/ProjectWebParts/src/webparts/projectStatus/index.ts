import '@pnp/polyfill-ie11';
import { IProjectStatusProps, ProjectStatus } from 'components/ProjectStatus';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart';
import { IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField } from '@microsoft/sp-property-pane';


export default class ProjectStatusWebPart extends BaseProjectWebPart<IProjectStatusProps> {
  public async onInit() {
    await super.onInit();
  }

  public render(): void {
    this.renderComponent(ProjectStatus, { riskMatrixCalloutTemplate: this.properties.riskMatrixCalloutTemplate });
  }

  // tslint:disable-next-line: naming-convention
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: 'Risikomatrise',
              groupFields: [
                PropertyPaneTextField('riskMatrixCalloutTemplate', {
                  label: 'Mal for Callout',
                  multiline: true,
                  resizable: true,
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}

