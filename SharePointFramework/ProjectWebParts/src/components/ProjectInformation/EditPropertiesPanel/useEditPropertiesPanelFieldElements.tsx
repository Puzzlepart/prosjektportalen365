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
import SPDataAdapter from '../../../data'
import { ProjectInformationField } from '../ProjectInformationField'
import { useEditPropertiesPanelModel } from './useEditPropertiesPanelModel'
import { FieldDescription } from 'pp365-shared-library/lib/components'

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
        onChange={(_, value) => model.set(field, value)}
      />
    ),
    Note: (field) => (
      <TextField
        label={field.title}
        description={field.description}
        multiline
        defaultValue={model.get<string>(field)}
        onChange={(_, value) => model.set(field, value)}
      />
    ),
    DateTime: (field) => (
      <>
        <DatePicker
          label={field.title}
          value={model.get(field, 'date')}
          onSelectDate={(date) => model.set(field, date)}
        />
        <FieldDescription description={field.description} />
      </>
    ),
    Choice: (field) => (
      <>
        <Dropdown
          label={field.title}
          options={field.choices}
          defaultSelectedKey={model.get<string>(field)}
          onChange={(_, option) => model.set(field, option.key)}
        />
        <FieldDescription description={field.description} />
      </>
    ),
    MultiChoice: (field) => (
      <>
        <Dropdown
          label={field.title}
          options={field.choices}
          multiSelect
          selectedKeys={model.get<string[]>(field, 'multichoice')}
          onChange={(_, option) => {
            const selectedKeys = model.get<string[]>(field, 'multichoice')
            if (option.selected) {
              model.set<string[]>(field, [...selectedKeys, option.key as string])
            } else {
              model.set<string[]>(
                field,
                selectedKeys.filter((key) => key !== option.key)
              )
            }
          }}
        />
        <FieldDescription description={field.description} />
      </>
    ),
    User: (field) => (
      <>
        <Label>{field.title}</Label>
        <NormalPeoplePicker
          onResolveSuggestions={async (filter, selectedItems) =>
            (await SPDataAdapter.clientPeoplePickerSearchUser(
              filter,
              selectedItems
            )) as IPersonaProps[]
          }
          defaultSelectedItems={model.get<IPersonaProps[]>(field, 'users')}
          itemLimit={1}
          onChange={(items) => model.set(field, items)}
        />
        <FieldDescription description={field.description} />
      </>
    ),
    UserMulti: (field) => (
      <>
        <Label>{field.title}</Label>
        <NormalPeoplePicker
          onResolveSuggestions={async (filter, selectedItems) =>
            (await SPDataAdapter.clientPeoplePickerSearchUser(
              filter,
              selectedItems
            )) as IPersonaProps[]
          }
          defaultSelectedItems={model.get<IPersonaProps[]>(field, 'users')}
          itemLimit={20}
          onChange={(items) => model.set(field, items)}
        />
        <FieldDescription description={field.description} />
      </>
    ),
    TaxonomyFieldType: (field) => (
      <>
        <Label>{field.title}</Label>
        <TagPicker
          onResolveSuggestions={async (filter, selectedItems) =>
            await SPDataAdapter.getTerms(field.getProperty('TermSetId'), filter, selectedItems)
          }
          defaultSelectedItems={model.get<ITag[]>(field, 'tags')}
          itemLimit={1}
          onChange={(items) => model.set(field, items)}
        />
        <FieldDescription description={field.description} />
      </>
    ),
    TaxonomyFieldTypeMulti: (field) => (
      <>
        <Label>{field.title}</Label>
        <TagPicker
          onResolveSuggestions={async (filter, selectedItems) =>
            await SPDataAdapter.getTerms(field.getProperty('TermSetId'), filter, selectedItems)
          }
          defaultSelectedItems={model.get<ITag[]>(field, 'tags')}
          itemLimit={20}
          onChange={(items) => model.set(field, items)}
        />
        <FieldDescription description={field.description} />
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
