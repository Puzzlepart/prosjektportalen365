import {
  DatePicker,
  Dropdown,
  IPersonaProps,
  ITag,
  Label,
  NormalPeoplePicker,
  TagPicker,
  TextField
} from '@fluentui/react'
import React from 'react'
import { ProjectInformationField } from '../types'
import { useEditPropertiesPanelModel } from './useEditPropertiesPanelModel'

/**
 * Hook for field elements of `EditPropertiesPanel` component. This hook is used to render field elements
 * based on field type. Supported field types are:
 *
 * - `Text`
 * - `Note`
 * - `DateTime`
 * - `Choice`
 * - `MultiChoice`
 * - `User`
 * - `UserMulti`
 * - `TaxonomyFieldType`
 * - `TaxonomyFieldTypeMulti`
 *
 * @param model Model returned from `useEditPropertiesPanelModel` hook
 */
export function useEditPropertiesPanelFieldElements(
  model: ReturnType<typeof useEditPropertiesPanelModel>
) {
  const fieldElements: Record<string, (field: ProjectInformationField) => JSX.Element> = {
    Text: (field) => (
      <TextField
        label={field.title}
        description={field.description}
        defaultValue={model.get<string>(field)}
      />
    ),
    Note: (field) => (
      <TextField
        label={field.title}
        description={field.description}
        multiline
        defaultValue={model.get<string>(field)}
      />
    ),
    DateTime: (field) => (
      <>
        <DatePicker label={field.title} value={model.get(field, 'date')} />
        <div
          style={{
            margin: '2px 0 0 0',
            color: 'rgb(97, 97, 97)',
            fontSize: 10
          }}
        >
          {field.description}
        </div>
      </>
    ),
    Choice: (field) => (
      <>
        <Dropdown
          label={field.title}
          options={field.choices}
          defaultSelectedKey={model.get<string>(field)}
        />
        <div
          style={{
            margin: '2px 0 0 0',
            color: 'rgb(97, 97, 97)',
            fontSize: 10
          }}
        >
          {field.description}
        </div>
      </>
    ),
    MultiChoice: (field) => (
      <>
        <Dropdown label={field.title} options={field.choices} multiSelect />
        <div
          style={{
            margin: '2px 0 0 0',
            color: 'rgb(97, 97, 97)',
            fontSize: 10
          }}
        >
          {field.description}
        </div>
      </>
    ),
    User: (field) => (
      <>
        <Label>{field.title}</Label>
        <NormalPeoplePicker
          onResolveSuggestions={async () => await Promise.resolve([])}
          defaultSelectedItems={model.get<IPersonaProps[]>(field, 'users')}
          itemLimit={1}
        />
        <div
          style={{
            margin: '2px 0 0 0',
            color: 'rgb(97, 97, 97)',
            fontSize: 10
          }}
        >
          {field.description}
        </div>
      </>
    ),
    UserMulti: (field) => (
      <>
        <Label>{field.title}</Label>
        <NormalPeoplePicker
          onResolveSuggestions={async () => await Promise.resolve([])}
          defaultSelectedItems={model.get<IPersonaProps[]>(field, 'users')}
          itemLimit={20}
        />
        <div
          style={{
            margin: '2px 0 0 0',
            color: 'rgb(97, 97, 97)',
            fontSize: 10
          }}
        >
          {field.description}
        </div>
      </>
    ),
    TaxonomyFieldType: (field) => (
      <>
        <Label>{field.title}</Label>
        <TagPicker
          onResolveSuggestions={async () => await Promise.resolve([])}
          defaultSelectedItems={model.get<ITag[]>(field, 'tags')}
          itemLimit={1}
        />
      </>
    ),
    TaxonomyFieldTypeMulti: (field) => (
      <>
        <Label>{field.title}</Label>
        <TagPicker
          onResolveSuggestions={async () => await Promise.resolve([])}
          defaultSelectedItems={model.get<ITag[]>(field, 'tags')}
          itemLimit={20}
        />
      </>
    )
  }

  /**
   * Get element to render for the specified field.
   *
   * @param field Field to get element for
   */
  const getFieldElement = (field: ProjectInformationField) => {
    return fieldElements[field.type] && fieldElements[field.type](field)
  }

  return getFieldElement
}
