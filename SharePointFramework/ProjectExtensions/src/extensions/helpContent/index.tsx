import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer, PlaceholderContent, PlaceholderName } from '@microsoft/sp-application-base';
// import { sp, Web } from '@pnp/sp';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

export interface IHelpContentApplicationCustomizerProperties { }

export default class HelpContentApplicationCustomizer extends BaseApplicationCustomizer<IHelpContentApplicationCustomizerProperties> {
  private _topPlaceholder: PlaceholderContent | undefined;

  @override
  public async onInit(): Promise<void> {
    if (!this._topPlaceholder) this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top, { onDispose: this._onDispose });
    if (!this._topPlaceholder) {
      return;
    }
    if (this._topPlaceholder.domElement) {
      ReactDOM.render(<div>HelpContentApplicationCustomizer</div>, this._topPlaceholder.domElement);
    }
  }

  private _getHelpContent() {

  }

  private _onDispose(): void { }
}
