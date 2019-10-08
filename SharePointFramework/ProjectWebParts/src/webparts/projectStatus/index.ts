import '@pnp/polyfill-ie11';
import { IProjectStatusProps, ProjectStatus } from 'components/ProjectStatus';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart';


export default class ProjectStatusWebPart extends BaseProjectWebPart<IProjectStatusProps> {
  public async onInit() {
    await super.onInit();
  }

  public render(): void {
    this.renderComponent(ProjectStatus, {});
  }
}
