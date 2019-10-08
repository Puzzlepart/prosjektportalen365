import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import '@pnp/polyfill-ie11';
import { IProjectStatusProps, ProjectStatus } from 'components/ProjectStatus';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart';
import { LOGGING_PAGE } from 'webparts/PropertyPane';


export default class ProjectStatusWebPart extends BaseProjectWebPart<IProjectStatusProps> {
  public async onInit() {
    await super.onInit();
  }

  public render(): void {
    this.renderComponent(ProjectStatus, {});
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [LOGGING_PAGE]
    };
  }
}
