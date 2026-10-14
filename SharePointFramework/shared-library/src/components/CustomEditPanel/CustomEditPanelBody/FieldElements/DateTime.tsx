import { useFieldControlProps_unstable } from '@fluentui/react-components'
import { DatePicker, DatePickerProps } from '@fluentui/react-datepicker-compat'
import strings from 'SharedLibraryStrings'
import React, { FC, useMemo, useState } from 'react'
import { formatDay, getDatePickerLocalization, parseShortDate } from '../../../../util'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

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
  // The picker in SharePoint's UI language: names, texts, dates, the week and its numbers.
  const localization = useMemo(() => getDatePickerLocalization(), [])

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
          // A day, written and read in SharePoint's UI language: the default parser (`Date.parse`)
          // cannot read a typed "15.03.2026".
          formatDate={formatDay}
          parseDateFromString={parseShortDate}
          placeholder={strings.Placeholder.DatePicker}
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
