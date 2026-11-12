/* eslint-disable no-console */
import strings from 'SharedLibraryStrings'
import _ from 'lodash'
import { useEffect } from 'react'
import { BooleanColumn } from './BooleanColumn'
import { GetDataTypeProperties, IColumnDataTypeFieldOption } from './ColumnDataTypeField'
import { CurrencyColumn } from './CurrencyColumn'
import { DateColumn } from './DateColumn'
import { DialogColumn } from './DialogColumn'
import { FileNameColumn } from './FileNameColumn'
import { InstrumentColumn } from './InstrumentColumn'
import { ListColumn } from './ListColumn'
import { NoteColumn } from './NoteColumn'
import { NumberColumn } from './NumberColumn'
import { PercentageColumn } from './PercentageColumn'
import { TagsColumn } from './TagsColumn'
import { TrendColumn } from './TrendColumn'
import { UrlColumn } from './UrlColumn'
import { UserColumn } from './UserColumn'
import { CalculatedColumn } from './CalculatedColumn'
import { ColumnRenderComponent } from './types'

/**
 * Registers cell renderers and the configuration choices shown by the column editor.
 */
export class ColumnRenderComponentRegistry {
  private static components: Map<string, ColumnRenderComponent<any> | IColumnDataTypeFieldOption> =
    new Map()
  private static options: IColumnDataTypeFieldOption[] = []

  /**
   * Builds a renderer choice with its stored ID, display text and icon.
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
   * Builds a renderer choice, returning null when the component has no display name.
   */
  private static createOptionFromComponent(
    component: ColumnRenderComponent<any>,
    getDataTypeProperties: GetDataTypeProperties = () => []
  ): IColumnDataTypeFieldOption {
    if (!component.displayName) {
      return null
    }
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
   * Registers each supplied renderer, leaving existing keys unchanged.
   */
  public static registerMultiple(...components: ColumnRenderComponent<any>[]) {
    components.forEach((component) => ColumnRenderComponentRegistry.register(component))
  }

  /**
   * Registers a renderer with a key, stored ID and icon; duplicate keys are ignored.
   */
  public static register(component: ColumnRenderComponent<any>) {
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
   * Registers an editor choice without a corresponding cell renderer.
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
   * Returns registered cell-rendering components, excluding standalone editor choices.
   */
  public static getComponents() {
    return Array.from(ColumnRenderComponentRegistry.components.values()).filter(
      (component) => typeof component === 'function'
    ) as ColumnRenderComponent<any>[]
  }

  /**
   * Builds and caches editor choices from the registered renderers and standalone options.
   */
  public static getOptions(): IColumnDataTypeFieldOption[] {
    if (!_.isEmpty(ColumnRenderComponentRegistry.options)) {
      return ColumnRenderComponentRegistry.options
    }
    ColumnRenderComponentRegistry.options = Array.from(
      ColumnRenderComponentRegistry.components.values()
    )
      .map((component) => {
        if (typeof component === 'function') {
          return component.getDataTypeOption()
        }
        return component
      })
      .filter(Boolean)
    return ColumnRenderComponentRegistry.options
  }

  /**
   * Finds an editor choice by its registry key.
   */
  static getOption(key: string): IColumnDataTypeFieldOption {
    if (!_.isEmpty(ColumnRenderComponentRegistry.options)) {
      return ColumnRenderComponentRegistry.options.find((option) => option.key === key)
    }
    return ColumnRenderComponentRegistry.getOptions().find((option) => option.key === key)
  }

  /**
   * Finds a cell renderer by key, returning null for missing or standalone choices.
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
 * Registers built-in cell renderers and text/note editor choices after mount.
 */
export function useColumnRenderComponentRegistry() {
  useEffect(() => {
    ColumnRenderComponentRegistry.registerMultiple(
      BooleanColumn,
      DateColumn,
      FileNameColumn,
      CurrencyColumn,
      NumberColumn,
      NoteColumn,
      PercentageColumn,
      ListColumn,
      DialogColumn,
      InstrumentColumn,
      TagsColumn,
      TrendColumn,
      UrlColumn,
      UserColumn,
      CalculatedColumn
    )
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
  }, [])
}
