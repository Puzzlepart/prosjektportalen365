import { getId } from '@fluentui/react'
import {
  IPropertyPaneCustomFieldProps,
  IPropertyPaneField,
  PropertyPaneFieldType
} from '@microsoft/sp-property-pane'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './PropertyPaneDescription.module.scss'

interface IPropertyPaneDescriptionProps extends IPropertyPaneCustomFieldProps {
  description: string
  hidden?: boolean
}

class PropertyPaneDescriptionBuilder implements IPropertyPaneField<IPropertyPaneDescriptionProps> {
  public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom
  public targetProperty: string
  public properties: IPropertyPaneDescriptionProps
  private elem: HTMLElement

  constructor(targetProperty: string, properties: IPropertyPaneDescriptionProps) {
    this.targetProperty = targetProperty
    this.properties = {
      ...properties,
      onRender: this.onRender.bind(this),
      onDispose: this.onDispose.bind(this)
    }
  }

  public render(): void {
    if (!this.elem) {
      return
    }

    this.onRender(this.elem)
  }

  private onDispose(element: HTMLElement): void {
    unmountComponentAtNode(element)
  }

  private onRender(elem: HTMLElement): void {
    if (!this.elem) {
      this.elem = elem
    }
    render(
      <div className={styles.propertyPaneDescription}>
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{this.properties.description}</ReactMarkdown>
      </div>,
      elem
    )
  }
}

/**
 * Helper method to create a description element for the property pane. This
 * method exists because some property pane controls do not support the
 * description property. This also supports markdown, unlike the default
 * description property for property pane controls.
 *
 * @param description The description to show
 * @param condition Condition to show the description
 */
export function PropertyPaneDescription(
  description: string,
  condition = true
): IPropertyPaneField<any> {
  const targetProperty = getId('PropertyPaneDescription')
  const key = getId('PropertyPaneDescription')
  return new PropertyPaneDescriptionBuilder(targetProperty, {
    description,
    hidden: !condition,
    key,
    onRender: null,
    onDispose: null
  })
}
