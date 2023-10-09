import { IPersonaProps, ITag, NormalPeoplePicker, TagPicker } from '@fluentui/react'
import { Combobox, Input, Option, Switch, Textarea } from '@fluentui/react-components'
import { DatePicker, DayOfWeek } from '@fluentui/react-datepicker-compat'
import _ from 'lodash'
import React from 'react'
import { ProjectInformationField } from '../../models'
import { FieldContainer } from '../FieldContainer'
import styles from './CustomEditPanel.module.scss'
import { ICustomEditPanelProps } from './types'
import { UseModelReturnType } from './useModel'

/**
 * Hook for field elements of `CustomEditPanel` component. This hook is used to render field elements
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
 * @param model Model returned from `useCustomEditPanelModel` hook
 * @param props Props passed to `CustomEditPanel` component
 */
export function useFieldElements(model: UseModelReturnType, props: ICustomEditPanelProps) {
  const fieldElements: Record<string, (field: ProjectInformationField) => JSX.Element> = {
    Boolean: (field) => (
      <FieldContainer
        iconName='ToggleLeft'
        label={field.displayName}
        description={field.description}
      >
        <Switch
          checked={model.get<boolean>(field)}
          onChange={(_, data) => model.set(field, data.checked)}
        />
      </FieldContainer>
    ),
    URL: (field) => {
      const value = model.get<{
        url: string
        description: string
      }>(field, { url: '', description: '' })
      return (
        <FieldContainer
          iconName='LinkMultiple'
          label={field.displayName}
          description={field.description}
        >
          <Input
            defaultValue={value.url}
            onChange={(_, data) =>
              model.set(field, { url: data.value, description: value.description })
            }
            placeholder={'strings.Placeholder.UrlField'}
          />
          <Input
            defaultValue={value.description}
            onChange={(_, data) => model.set(field, { url: value.url, description: data.value })}
            placeholder={'strings.Placeholder.UrlFieldAlternative'}
            style={{ marginTop: 6 }}
          />
        </FieldContainer>
      )
    },
    Text: (field) => (
      <FieldContainer
        iconName='TextNumberFormat'
        label={field.displayName}
        description={field.description}
      >
        <Input
          defaultValue={model.get<string>(field)}
          onChange={(_, data) => model.set(field, data.value)}
          placeholder={'strings.Placeholder.TextField'}
        />
      </FieldContainer>
    ),
    Note: (field) => (
      <FieldContainer
        iconName='TextAlignLeft'
        label={field.displayName}
        description={field.description}
      >
        <Textarea
          defaultValue={model.get<string>(field)}
          onChange={(_, data) => model.set(field, data.value)}
          placeholder={'strings.Placeholder.TextField'}
        />
      </FieldContainer>
    ),
    DateTime: (field) => (
      <FieldContainer iconName='Calendar' label={field.displayName} description={field.description}>
        <DatePicker
          // TODO: Fix FluentProvider bug with DatePicker
          value={model.get(field)}
          onSelectDate={(date) => model.set(field, date)}
          formatDate={(date) => date.toLocaleDateString()}
          placeholder={'strings.Placeholder.DatePicker'}
          firstDayOfWeek={DayOfWeek.Monday}
          showWeekNumbers
          allowTextInput
        />
      </FieldContainer>
    ),
    Choice: (field) => (
      <FieldContainer
        iconName='MultiselectLtr'
        label={field.displayName}
        description={field.description}
      >
        <Combobox
          value={model.get<string>(field)}
          defaultSelectedOptions={[model.get<string>(field)]}
          placeholder={'strings.Placeholder.ChoiceField'}
          onOptionSelect={(_, data) => model.set(field, data.optionValue)}
        >
          {field.choices.map((choice) => (
            <Option key={choice}>{choice}</Option>
          ))}
        </Combobox>
      </FieldContainer>
    ),
    MultiChoice: (field) => (
      <FieldContainer
        iconName='MultiselectLtr'
        label={field.displayName}
        description={field.description}
      >
        <Combobox
          value={model.get<string[]>(field) ? model.get<string[]>(field).join(', ') : ''}
          defaultSelectedOptions={model.get<string[]>(field) ? model.get<string[]>(field) : []}
          multiselect
          placeholder={'strings.Placeholder.MultiChoiceField'}
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
      </FieldContainer>
    ),
    User: (field) => (
      <FieldContainer iconName='Person' label={field.displayName} description={field.description}>
        <NormalPeoplePicker
          styles={{ text: styles.field }}
          onResolveSuggestions={async (filter, selectedItems) =>
            (await props.dataAdapter.clientPeoplePickerSearchUser(
              filter,
              selectedItems
            )) as IPersonaProps[]
          }
          defaultSelectedItems={model.get<IPersonaProps[]>(field)}
          itemLimit={1}
          onChange={(items) => model.set(field, items)}
        />
      </FieldContainer>
    ),
    UserMulti: (field) => (
      <FieldContainer iconName='People' label={field.displayName} description={field.description}>
        <NormalPeoplePicker
          styles={{ text: styles.field }}
          onResolveSuggestions={async (filter, selectedItems) =>
            (await props.dataAdapter.clientPeoplePickerSearchUser(
              filter,
              selectedItems
            )) as IPersonaProps[]
          }
          defaultSelectedItems={model.get<IPersonaProps[]>(field)}
          itemLimit={20}
          onChange={(items) => model.set(field, items)}
        />
      </FieldContainer>
    ),
    TaxonomyFieldType: (field) => (
      <FieldContainer iconName='AppsList' label={field.displayName} description={field.description}>
        <TagPicker
          styles={{ text: styles.field }}
          onResolveSuggestions={async (filter, selectedItems) =>
            await props.dataAdapter.getTerms(field.getProperty('TermSetId'), filter, selectedItems)
          }
          onEmptyResolveSuggestions={async (selectedItems) =>
            await props.dataAdapter.getTerms(field.getProperty('TermSetId'), '', selectedItems)
          }
          defaultSelectedItems={model.get<ITag[]>(field)}
          itemLimit={1}
          onChange={(items) => model.set(field, items)}
        />
      </FieldContainer>
    ),
    TaxonomyFieldTypeMulti: (field) => (
      <FieldContainer iconName='AppsList' label={field.displayName} description={field.description}>
        <TagPicker
          styles={{ text: styles.field }}
          onResolveSuggestions={async (filter, selectedItems) =>
            await props.dataAdapter.getTerms(field.getProperty('TermSetId'), filter, selectedItems)
          }
          onEmptyResolveSuggestions={async (selectedItems) =>
            await props.dataAdapter.getTerms(field.getProperty('TermSetId'), '', selectedItems)
          }
          defaultSelectedItems={model.get<ITag[]>(field)}
          itemLimit={20}
          onChange={(items) => model.set(field, items)}
        />
      </FieldContainer>
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
