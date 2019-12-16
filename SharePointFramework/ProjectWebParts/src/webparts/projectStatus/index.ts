import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneSlider } from '@microsoft/sp-property-pane';
import '@pnp/polyfill-ie11';
import { IProjectStatusProps, ProjectStatus } from 'components/ProjectStatus';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart';


export default class ProjectStatusWebPart extends BaseProjectWebPart<IProjectStatusProps> {
  public async onInit() {
    await super.onInit();
  }

  public render(): void {
    this.renderComponent(ProjectStatus, {
      riskMatrixWidth: this.properties.riskMatrixWidth,
      riskMatrixHeight: this.properties.riskMatrixHeight,
      riskMatrixCalloutTemplate: this.properties.riskMatrixCalloutTemplate,
    });
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
                PropertyPaneSlider('riskMatrixWidth', {
                  label: 'Bredde',
                  min: 400,
                  max: 1000,
                  value: 400,
                  showValue: true,
                }),
                PropertyPaneSlider('riskMatrixHeight', {
                  label: 'Høyde',
                  min: 400,
                  max: 1000,
                  value: 400,
                  showValue: true,
                }),
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

