import { useFieldControlProps_unstable } from '@fluentui/react-components'
import { DatePicker, DatePickerProps } from '@fluentui/react-datepicker-compat'
import React, { FC } from 'react'
import strings from 'SharedLibraryStrings'
import { formatDay, parseShortDate } from '../../util/formatDate'
import { FieldContainer } from '../FieldContainer'
import { IDateFieldProps } from './types'
import { useDateField } from './useDateField'

/**
 * The date picker with the id of the field it is in. It takes an id of its own otherwise, so the
 * field's label pointed at nothing: a click on it did not reach the date.
 */
const FieldDatePicker: FC<DatePickerProps> = (props) => (
  <DatePicker {...useFieldControlProps_unstable(props, { supportsLabelFor: true })} />
)

/**
 * A day in a `FieldContainer`: Fluent's `DatePicker` in SharePoint's UI language, with week
 * numbers, a typed day read the way the picker writes it ("15.03.2026"), the label tied to the
 * input, and the calendar mounted in an element of its own, so a drawer's transform and overflow
 * do not place or clip it. The shared form fields and the forms outside them render this one.
 */
export const DateField: FC<IDateFieldProps> = (props) => {
  const { popupRef, setPopupRef, localization } = useDateField()

  return (
    <FieldContainer
      iconName={props.iconName ?? 'Calendar'}
      label={props.label}
      description={props.description}
      required={props.required}
      hidden={props.hidden}
      validationState={props.validationState}
      validationMessage={props.validationMessage}
    >
      {popupRef && (
        <FieldDatePicker
          value={props.value ?? undefined}
          // The picker reports a cleared day as `null`; callers get `undefined`.
          onSelectDate={(date) => props.onSelectDate(date ?? undefined)}
          // A day, written and read in SharePoint's UI language: the default parser (`Date.parse`)
          // cannot read a typed "15.03.2026".
          formatDate={formatDay}
          parseDateFromString={parseShortDate}
          placeholder={props.placeholder ?? strings.Placeholder.DatePicker}
          disabled={props.disabled}
          {...localization}
          showWeekNumbers
          allowTextInput
          showMonthPickerAsOverlay={false}
          mountNode={popupRef}
        />
      )}
      <div
        ref={setPopupRef}
        style={{
          position: 'absolute',
          zIndex: 1000000,
          left: 0,
          top: 0
        }}
      />
    </FieldContainer>
  )
}

DateField.displayName = 'DateField'
