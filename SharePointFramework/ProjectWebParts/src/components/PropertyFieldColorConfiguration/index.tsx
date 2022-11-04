import { IPropertyPaneField, PropertyPaneFieldType } from '@microsoft/sp-property-pane'
import React from 'react'
import { render } from 'react-dom'
import { IPropertyFieldColorConfigurationProps } from './types'
import { ColorConfigurator } from './ColorConfigurator'

class PropertyFieldColorConfigurationBuilder
  implements IPropertyPaneField<IPropertyFieldColorConfigurationProps> {
  public targetProperty: string
  public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom
  public properties: IPropertyFieldColorConfigurationProps

  public constructor(_targetProperty: string, _properties: IPropertyFieldColorConfigurationProps) {
    this.targetProperty = _targetProperty
    this.properties = {
      ..._properties,
      onRender: this.onRender.bind(this)
    }
  }

  public onRender(
    element: HTMLElement,
    _context?: any,
    changeCallback?: (targetProperty?: string, newValue?: any) => void
  ): void {
    render(
      <ColorConfigurator
        {...this.properties}
        onChange={(_, newValue) => changeCallback(this.targetProperty, newValue)}
      />,
      element
    )
  }
}

export default function (
  targetProperty: string,
  properties: Omit<IPropertyFieldColorConfigurationProps, 'onRender'>
): IPropertyPaneField<IPropertyFieldColorConfigurationProps> {
  return new PropertyFieldColorConfigurationBuilder(targetProperty, {
    ...properties,
    onRender: null
  })
}
