import { IPersonaProps, ITag, NormalPeoplePicker, TagPicker } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { ProjectInformationField } from 'pp365-shared-library/lib/models'
import React from 'react'
import SPDataAdapter from '../../../data'
import { UseModelReturnType } from './useModel'
import _ from 'lodash'
import { Option, Input, Textarea, Combobox, Switch } from '@fluentui/react-components'
import {
  AppsListFilled,
  AppsListRegular,
  CalendarRegular,
  LinkMultipleRegular,
  MultiselectLtrRegular,
  PeopleRegular,
  PersonRegular,
  TextAlignLeftRegular,
  TextNumberFormatRegular,
  ToggleLeftRegular
} from '@fluentui/react-icons'
import styles from './EditPropertiesPanel.module.scss'
import { DatePicker, DayOfWeek } from '@fluentui/react-datepicker-compat'
import { IconField } from 'pp365-shared-library'

/**
 * Hook for field elements of `EditPropertiesPanel` component. This hook is used to render field elements
 * based on field type. Supported field types are:
 *
 * - `Boolean`
 * - `URL`
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
export function useFieldElements(model: UseModelReturnType) {
  const fieldElements: Record<string, (field: ProjectInformationField) => JSX.Element> = {
    Boolean: (field) => (
      <IconField icon={ToggleLeftRegular} label={field.displayName} hint={field.description}>
        <Switch
          checked={model.get<boolean>(field)}
          onChange={(_, data) => model.set(field, data.checked)}
        />
      </IconField>
    ),
    URL: (field) => {
      const value = model.get<{
        url: string
        description: string
      }>(field, { url: '', description: '' })
      return (
        <IconField icon={LinkMultipleRegular} label={field.displayName} hint={field.description}>
          <Input
            defaultValue={value.url}
            onChange={(_, data) =>
              model.set(field, { url: data.value, description: value.description })
            }
            placeholder={strings.Placeholder.UrlField}
          />
          <Input
            defaultValue={value.description}
            onChange={(_, data) => model.set(field, { url: value.url, description: data.value })}
            placeholder={strings.Placeholder.UrlFieldAlternative}
            style={{ marginTop: 6 }}
          />
        </IconField>
      )
    },
    Text: (field) => (
      <IconField icon={TextNumberFormatRegular} label={field.displayName} hint={field.description}>
        <Input
          defaultValue={model.get<string>(field)}
          onChange={(_, data) => model.set(field, data.value)}
          placeholder={strings.Placeholder.TextField}
        />
      </IconField>
    ),
    Note: (field) => (
      <IconField icon={TextAlignLeftRegular} label={field.displayName} hint={field.description}>
        <Textarea
          defaultValue={model.get<string>(field)}
          onChange={(_, data) => model.set(field, data.value)}
          placeholder={strings.Placeholder.TextField}
        />
      </IconField>
    ),
    DateTime: (field) => (
      <IconField icon={CalendarRegular} label={field.displayName} hint={field.description}>
        <DatePicker
          // TODO: Fix FluentProvider bug with DatePicker
          value={model.get(field)}
          onSelectDate={(date) => model.set(field, date)}
          formatDate={(date) => date.toLocaleDateString()}
          placeholder={strings.Placeholder.DatePicker}
          firstDayOfWeek={DayOfWeek.Monday}
          showWeekNumbers
          allowTextInput
        />
      </IconField>
    ),
    Choice: (field) => (
      <IconField icon={MultiselectLtrRegular} label={field.displayName} hint={field.description}>
        <Combobox
          value={model.get<string>(field)}
          defaultSelectedOptions={[model.get<string>(field)]}
          placeholder={strings.Placeholder.ChoiceField}
          onOptionSelect={(_, data) => model.set(field, data.optionValue)}
        >
          {field.choices.map((choice) => (
            <Option key={choice}>{choice}</Option>
          ))}
        </Combobox>
      </IconField>
    ),
    MultiChoice: (field) => (
      <IconField icon={MultiselectLtrRegular} label={field.displayName} hint={field.description}>
        <Combobox
          value={model.get<string[]>(field) ? model.get<string[]>(field).join(', ') : ''}
          defaultSelectedOptions={model.get<string[]>(field) ? model.get<string[]>(field) : []}
          multiselect
          placeholder={strings.Placeholder.MultiChoiceField}
          onOptionSelect={(e, data) => {
            if (!_.isEmpty(data.selectedOptions)) {
              model.set<string[]>(field, data.selectedOptions)
            } else {
              model.set<string[]>(field, [''])
            }
          }}
        >
          {field.choices.map((choice) => (
            <Option key={choice}>{choice}</Option>
          ))}
        </Combobox>
      </IconField>
    ),
    User: (field) => (
      <IconField icon={PersonRegular} label={field.displayName} hint={field.description}>
        <NormalPeoplePicker
          styles={{ text: styles.field }}
          onResolveSuggestions={async (filter, selectedItems) =>
            (await SPDataAdapter.clientPeoplePickerSearchUser(
              filter,
              selectedItems
            )) as IPersonaProps[]
          }
          defaultSelectedItems={model.get<IPersonaProps[]>(field)}
          itemLimit={1}
          onChange={(items) => model.set(field, items)}
        />
      </IconField>
    ),
    UserMulti: (field) => (
      <IconField icon={PeopleRegular} label={field.displayName} hint={field.description}>
        <NormalPeoplePicker
          styles={{ text: styles.field }}
          onResolveSuggestions={async (filter, selectedItems) =>
            (await SPDataAdapter.clientPeoplePickerSearchUser(
              filter,
              selectedItems
            )) as IPersonaProps[]
          }
          defaultSelectedItems={model.get<IPersonaProps[]>(field)}
          itemLimit={20}
          onChange={(items) => model.set(field, items)}
        />
      </IconField>
    ),
    TaxonomyFieldType: (field) => (
      <IconField icon={AppsListRegular} label={field.displayName} hint={field.description}>
        <TagPicker
          styles={{ text: styles.field }}
          onResolveSuggestions={async (filter, selectedItems) =>
            await SPDataAdapter.getTerms(field.getProperty('TermSetId'), filter, selectedItems)
          }
          onEmptyResolveSuggestions={async (selectedItems) =>
            await SPDataAdapter.getTerms(field.getProperty('TermSetId'), '', selectedItems)
          }
          defaultSelectedItems={model.get<ITag[]>(field)}
          itemLimit={1}
          onChange={(items) => model.set(field, items)}
        />
      </IconField>
    ),
    TaxonomyFieldTypeMulti: (field) => (
      <IconField icon={AppsListFilled} label={field.displayName} hint={field.description}>
        <TagPicker
          styles={{ text: styles.field }}
          onResolveSuggestions={async (filter, selectedItems) =>
            await SPDataAdapter.getTerms(field.getProperty('TermSetId'), filter, selectedItems)
          }
          onEmptyResolveSuggestions={async (selectedItems) =>
            await SPDataAdapter.getTerms(field.getProperty('TermSetId'), '', selectedItems)
          }
          defaultSelectedItems={model.get<ITag[]>(field)}
          itemLimit={20}
          onChange={(items) => model.set(field, items)}
        />
      </IconField>
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
