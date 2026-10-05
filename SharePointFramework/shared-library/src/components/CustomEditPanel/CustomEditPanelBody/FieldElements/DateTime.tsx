import { useFieldControlProps_unstable } from '@fluentui/react-components'
import { DatePicker, DatePickerProps } from '@fluentui/react-datepicker-compat'
import strings from 'SharedLibraryStrings'
import React, { FC, useState } from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

/**
 * Monday, as the date picker's numeric `DayOfWeek` counts it. The compat package declares the enum
 * but does not export it.
 */
const FIRST_DAY_OF_WEEK = 1

/**
 * The date picker with the id of the field it is in. It takes an id of its own otherwise, so the
 * field's label pointed at nothing: a click on it did not reach the date.
 */
const FieldDatePicker: FC<DatePickerProps> = (props) => (
  <DatePicker {...useFieldControlProps_unstable(props, { supportsLabelFor: true })} />
)

export const DateTime: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  const [popupRef, setPopupRef] = useState<HTMLDivElement | null>(null)

  return (
    <FieldContainer
      iconName='Calendar'
      label={field.displayName}
      description={field.description}
      required={field.required}
    >
      {popupRef && (
        <FieldDatePicker
          value={context.model.get(field)}
          onSelectDate={(date) => context.model.set(field, date)}
          formatDate={(date) => date.toLocaleDateString()}
          placeholder={strings.Placeholder.DatePicker}
          firstDayOfWeek={FIRST_DAY_OF_WEEK}
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
