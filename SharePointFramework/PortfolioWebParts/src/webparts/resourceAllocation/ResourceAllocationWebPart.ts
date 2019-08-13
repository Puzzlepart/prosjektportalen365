import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { setupWebPart } from '../@setup';
import { ResourceAllocation, IResourceAllocationProps } from 'components';

export default class ResourceAllocationWebPart extends BaseClientSideWebPart<IResourceAllocationProps> {
  public render() {
    const element: React.ReactElement<IResourceAllocationProps> = React.createElement(ResourceAllocation, { ...this.properties });
    ReactDom.render(element, this.domElement);
  }

  public async onInit() {
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
