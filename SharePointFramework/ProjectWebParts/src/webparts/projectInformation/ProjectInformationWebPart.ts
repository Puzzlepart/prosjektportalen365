import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import ProjectInformation from './components/ProjectInformation';
import { IProjectInformationWebPartProps } from './IProjectInformationWebPartProps';
import { IProjectInformationProps } from './components/IProjectInformationProps';
import { sp } from '@pnp/sp';

export default class ProjectInformationWebPart extends BaseClientSideWebPart<IProjectInformationWebPartProps> {
  public async onInit() {
    sp.setup({ spfxContext: this.context });
  }

  public async render(): Promise<void> {
    const element: React.ReactElement<IProjectInformationProps> = React.createElement(
      ProjectInformation,
      {
        ...this.properties,
        context: this.context,
        isSiteAdmin: this.context.pageContext.legacyPageContext.isSiteAdmin,
        filterField: 'GtShowFieldFrontpage'
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse(this.manifest.version);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
