/* eslint-disable no-console */
import strings from 'PortfolioWebPartsStrings'
import { useEffect } from 'react'
import { BooleanColumn } from './BooleanColumn'
import { GetDataTypeProperties, IColumnDataTypeFieldOption } from './ColumnDataTypeField'
import { CurrencyColumn } from './CurrencyColumn'
import { DateColumn } from './DateColumn'
import { FileNameColumn } from './FileNameColumn'
import { ListColumn } from './ListColumn'
import { ModalColumn } from './ModalColumn'
import { TagsColumn } from './TagsColumn'
import { TrendColumn } from './TrendColumn'
import { UrlColumn } from './UrlColumn'
import { UserColumn } from './UserColumn'
import { ColumnRenderComponent } from './types'
import _ from 'lodash'

/**
 * A registry for column render components and column data type field options.
 *
 * @method register Registers a new column render component to the registry.
 * @method registerColumnRenderOption Registers a new column data type field option to the registry without a corresponding column render component.
 * @method getComponents Returns an array of all registered column render components.
 * @method getOptions Returns an array of column data type field dropdown options for all registered column render components.
 * @method getOption Returns a column data type field dropdown option for a specific column render component.
 */
export class ColumnRenderComponentRegistry {
  private static components: Map<string, ColumnRenderComponent<any> | IColumnDataTypeFieldOption> =
    new Map()
  private static options: IColumnDataTypeFieldOption[] = []

  /**
   * Creates a new column data type field option object.
   *
   * @param key The unique key for the column data type field option.
   * @param id The unique ID for the column data type field option.
   * @param text The display text for the column data type field option.
   * @param iconName The name of the icon to display for the column data type field option.
   * @param data Optional data to attach to the column data type field option.
   *
   * @returns A new column data type field option object.
   */
  private static createOption(
    key: string,
    id: string,
    text: string,
    iconName: string,
    data: Record<string, any> = {}
  ): IColumnDataTypeFieldOption {
    return {
      key,
      id,
      text,
      data: {
        ...data,
        iconProps: { iconName: iconName }
      }
    }
  }

  /**
   * Creates a new column data type field option object from a column render component.
   *
   * @param component The column render component to create the option from.
   * @param getDataTypeProperties A function that returns an array of data type properties for the component.
   *
   * @returns A new column data type field option object.
   */
  private static createOptionFromComponent(
    component: ColumnRenderComponent<any>,
    getDataTypeProperties: GetDataTypeProperties = () => []
  ): IColumnDataTypeFieldOption {
    return {
      ...ColumnRenderComponentRegistry.createOption(
        component.key,
        component.id,
        component.displayName,
        component.iconName,
        { getDataTypeProperties: component.getDataTypeProperties ?? getDataTypeProperties }
      ),
      disabled: component.isDisabled
    }
  }

  /**
   * Registers a new column render component to the registry.
   *
   * @param component The column render component to register.
   * @param getDataTypeProperties A function that returns an array of data type properties for the component.
   */
  public static register(
    component: ColumnRenderComponent<any>
  ) {
    if (ColumnRenderComponentRegistry.components.has(component.key)) {
      return
    }
    if (!component.displayName) {
      component.isDisabled = true
    }
    if (!component.key) {
      console.warn(
        `Column render component ${component.displayName} needs to have property "key" defined.`
      )
      return
    }
    if (!component.id) {
      console.warn(
        `Column render component ${component.displayName} needs to have property "id" defined.`
      )
      return
    }
    if (!component.iconName) {
      console.warn(
        `Column render component ${component.displayName} needs to have property "iconName" defined.`
      )
      return
    }
    component.getDataTypeOption = () =>
      ColumnRenderComponentRegistry.createOptionFromComponent(component)
    ColumnRenderComponentRegistry.components.set(component.key, component)
  }

  /**
   * Registers a new column data type field option to the registry without a corresponding column render component.
   *
   * @param key The unique key for the column data type field option.
   * @param id The unique ID for the column data type field option.
   * @param text The display text for the column data type field option.
   * @param iconName The name of the icon to display for the column data type field option.
   */
  public static registerColumnRenderOption(
    key: string,
    id: string,
    text: string,
    iconName: string
  ) {
    if (ColumnRenderComponentRegistry.components.has(key)) {
      return
    }
    ColumnRenderComponentRegistry.components.set(
      key,
      ColumnRenderComponentRegistry.createOption(key, id, text, iconName)
    )
  }

  /**
   * Returns an array of all registered column render components.
   *
   * @returns An array of all registered column render components.
   */
  public static getComponents() {
    return Array.from(ColumnRenderComponentRegistry.components.values()).filter(
      (component) => typeof component === 'function'
    ) as ColumnRenderComponent<any>[]
  }

  /**
   * Returns an array of column data type field dropdown options for all registered column render components
   * and column data type field options without a corresponding column render component.
   *
   * @returns An array of column data type field dropdown options for all registered column render components
   * and column data type field options without a corresponding column render component.
   */
  public static getOptions(): IColumnDataTypeFieldOption[] {
    if (!_.isEmpty(ColumnRenderComponentRegistry.options)) {
      return ColumnRenderComponentRegistry.options
    }
    ColumnRenderComponentRegistry.options = Array.from(
      ColumnRenderComponentRegistry.components.values()
    ).map((component) => {
      if (typeof component === 'function') {
        return component.getDataTypeOption()
      }
      return component
    })
    return ColumnRenderComponentRegistry.options
  }

  /**
   * Returns the column data type field option with the specified key.
   *
   * @param key The unique key of the column data type field option to retrieve.
   *
   * @returns The column data type field option with the specified key.
   */
  static getOption(key: string): IColumnDataTypeFieldOption {
    if (!_.isEmpty(ColumnRenderComponentRegistry.options)) {
      return ColumnRenderComponentRegistry.options.find((option) => option.key === key)
    }
    return ColumnRenderComponentRegistry.getOptions().find((option) => option.key === key)
  }

  /**
   * Returns the column render component with the specified key.
   *
   * @param key The unique key of the column render component to retrieve.
   *
   * @returns The column render component with the specified key.
   */
  static getComponent(key: string) {
    const component = ColumnRenderComponentRegistry.components.get(key)
    if (typeof component === 'function') {
      return component
    }
    return null
  }
}

/**
 * A hook that provides access to the column render component registry.
 *
 * @returns An object containing methods to interact with the column render component registry.
 */
export function useColumnRenderComponentRegistry() {
  useEffect(() => {
    ColumnRenderComponentRegistry.register(BooleanColumn)
    ColumnRenderComponentRegistry.register(CurrencyColumn)
    ColumnRenderComponentRegistry.register(DateColumn)
    ColumnRenderComponentRegistry.register(FileNameColumn)
    ColumnRenderComponentRegistry.register(ListColumn)
    ColumnRenderComponentRegistry.register(ModalColumn)
    ColumnRenderComponentRegistry.register(TagsColumn)
    ColumnRenderComponentRegistry.register(TrendColumn)
    ColumnRenderComponentRegistry.register(UrlColumn)
    ColumnRenderComponentRegistry.register(UserColumn)
    ColumnRenderComponentRegistry.registerColumnRenderOption(
      'text',
      'Text',
      strings.ColumnRenderOptionText,
      'FontColor'
    )
    ColumnRenderComponentRegistry.registerColumnRenderOption(
      'note',
      'Note',
      strings.ColumnRenderOptionNote,
      'EditStyle'
    )
    ColumnRenderComponentRegistry.registerColumnRenderOption(
      'number',
      'Number',
      strings.ColumnRenderOptionNumber,
      'NumberedList'
    )
    ColumnRenderComponentRegistry.registerColumnRenderOption(
      'percentage',
      'Percentage',
      strings.ColumnRenderOptionPercentage,
      'CalculatorPercentage'
    )
  }, [])
}