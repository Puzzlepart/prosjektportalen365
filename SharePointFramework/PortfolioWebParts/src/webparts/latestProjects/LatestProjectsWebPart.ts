import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import LatestProjects from './components/LatestProjects';
import { ILatestProjectsProps } from './components/ILatestProjectsProps';
import { setupWebPart } from '../@setup';
import { Logger, LogLevel } from '@pnp/logging';
import { ILatestProjectsWebPartProps } from './ILatestProjectsWebPartProps';

export default class LatestProjectsWebPart extends BaseClientSideWebPart<ILatestProjectsWebPartProps> {
  public render(): void {
    Logger.log({ message: '(LatestProjectsWebPart) render: Rendering <LatestProjects />', level: LogLevel.Info });
    const element: React.ReactElement<ILatestProjectsProps> = React.createElement(
      LatestProjects,
      {
        hubSiteId: this.context.pageContext.legacyPageContext.hubSiteId,
        displayMode: this.displayMode,
        updateProperty: (value: string) => {
          this.properties.title = value;
        },
        ...this.properties,
      }
    );
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(LatestProjectsWebPart) onInit: Initializing LatestProjectsWebPart', level: LogLevel.Info });
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
