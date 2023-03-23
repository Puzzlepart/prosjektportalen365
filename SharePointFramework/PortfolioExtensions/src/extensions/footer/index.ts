import {
  BaseApplicationCustomizer, PlaceholderContent, PlaceholderName
} from '@microsoft/sp-application-base'
import { Footer } from 'components/Footer'
import React from 'react'
import ReactDOM from 'react-dom'
import { IFooterApplicationCustomizerProperties } from './types'

export default class FooterApplicationCustomizer
  extends BaseApplicationCustomizer<IFooterApplicationCustomizerProperties> {
  private _bottomPlaceholder: PlaceholderContent

  public async onInit(): Promise<void> {
    await super.onInit()
    this._renderFooter(PlaceholderName.Bottom)
  }

  /**
   * Render the footer in the specified placeholder. Creates a
   * placeholder if it doesn't exist and adds a new div element
   * to the placeholder where the footer will be rendered.
   * 
   * @param name Placeholder name
   */
  private _renderFooter(name: PlaceholderName): void {
    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder =
        this.context.placeholderProvider.tryCreateContent(
          name,
          { onDispose: this._onDispose })
    }
    const footerElement: HTMLDivElement = document.createElement('div')
    ReactDOM.render(React.createElement(Footer, {}), footerElement)
    this._bottomPlaceholder.domElement.append(footerElement)
  }

  protected _onDispose(): void {
    // eslint-disable-next-line no-console
    console.log('[FooterApplicationCustomizer._onDispose] Disposed custom footer.')
  }
}
