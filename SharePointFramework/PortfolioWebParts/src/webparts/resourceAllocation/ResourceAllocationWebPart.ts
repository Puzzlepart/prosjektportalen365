import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { Logger, LogLevel } from '@pnp/logging';
import { IResourceAllocationProps, ResourceAllocation } from 'components';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ISetupWebPartResult, setupWebPart } from '../@setup';

export default class ResourceAllocationWebPart extends BaseClientSideWebPart<IResourceAllocationProps> {
  private _setup: ISetupWebPartResult;

  public render() {
    Logger.log({ message: '(ResourceAllocationWebPart) render: Rendering <ResourceAllocation />', level: LogLevel.Info });
    const element: React.ReactElement<IResourceAllocationProps> = React.createElement(ResourceAllocation, {
      ...this.properties,
      ...this._setup,
    });
    ReactDom.render(element, this.domElement);
  }

  public async onInit() {
    Logger.log({ message: '(ResourceAllocationWebPart) onInit: Initializing ResourceAllocationWebPart', level: LogLevel.Info });
    this._setup = await setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
