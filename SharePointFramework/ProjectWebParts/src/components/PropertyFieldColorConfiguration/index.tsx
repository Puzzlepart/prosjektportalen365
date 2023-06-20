import {
  IPropertyPaneField,
  PropertyPaneFieldType
} from '@microsoft/sp-property-pane'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { ColorConfigurator } from './ColorConfigurator'
import { IPropertyFieldColorConfigurationProps } from './types'

class PropertyFieldColorConfigurationBuilder
  implements IPropertyPaneField<IPropertyFieldColorConfigurationProps>
{
  public targetProperty: string
  public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom
  public properties: IPropertyFieldColorConfigurationProps

  public constructor(
    _targetProperty: string,
    _properties: IPropertyFieldColorConfigurationProps
  ) {
    this.targetProperty = _targetProperty
    this.properties = {
      ..._properties,
      onRender: this.onRender.bind(this),
      onDispose: this.onRender.bind(this)
    }
    this._onChange = this._onChange.bind(this)
  }

  protected _onChange(
    changeCallback: (targetProperty?: string, newValue?: any) => void,
    newValue: any
  ) {
    changeCallback(this.targetProperty, newValue)
  }

  public onRender(
    element: HTMLElement,
    _context?: any,
    changeCallback?: (targetProperty?: string, newValue?: any) => void
  ): void {
    render(
      <ColorConfigurator
        {...this.properties}
        onChange={(_, newValue) => this._onChange(changeCallback, newValue)}
      />,
      element
    )
  }

  public onDispose(element: HTMLElement): void {
    unmountComponentAtNode(element)
  }
}

export default function (
  targetProperty: string,
  properties: Omit<IPropertyFieldColorConfigurationProps, 'onRender'>
): IPropertyPaneField<IPropertyFieldColorConfigurationProps> {
  return new PropertyFieldColorConfigurationBuilder(targetProperty, {
    ...properties,
    onRender: null,
    onDispose: null
  })
}
