import { DatePicker } from '@fluentui/react-datepicker-compat'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'
import { DayOfWeek } from '@fluentui/react'

export const DateTime: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  return (
    <FieldContainer iconName='Calendar' label={field.displayName} description={field.description}>
      <DatePicker
        value={context.model.get(field)}
        onSelectDate={(date) => context.model.set(field, date)}
        formatDate={(date) => date.toLocaleDateString()}
        placeholder={strings.Placeholder.DatePicker}
        firstDayOfWeek={DayOfWeek.Monday}
        showWeekNumbers
        allowTextInput
        showMonthPickerAsOverlay={false}
      />
    </FieldContainer>
  )
}
