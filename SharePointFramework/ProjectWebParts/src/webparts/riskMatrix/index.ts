import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { IRiskMatrixProps, RiskMatrix } from 'components/RiskMatrix';
import * as React from 'react';
import * as ReactDom from 'react-dom';


export interface IRiskMatrixWebPartProps { }

export default class RiskMatrixWebPart extends BaseClientSideWebPart<IRiskMatrixWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IRiskMatrixProps> = React.createElement(RiskMatrix, {});

    ReactDom.render(element, this.domElement);
  }

  // tslint:disable-next-line: naming-convention
  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }


  // tslint:disable-next-line: naming-convention
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: []
    };
  }
}
