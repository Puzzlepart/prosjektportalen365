import { DatePicker } from '@fluentui/react-datepicker-compat'
import strings from 'SharedLibraryStrings'
import React, { useState } from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'
import { DayOfWeek } from '@fluentui/react'

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
        <DatePicker
          value={context.model.get(field)}
          onSelectDate={(date) => context.model.set(field, date)}
          formatDate={(date) => date.toLocaleDateString()}
          placeholder={strings.Placeholder.DatePicker}
          firstDayOfWeek={DayOfWeek.Monday}
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
