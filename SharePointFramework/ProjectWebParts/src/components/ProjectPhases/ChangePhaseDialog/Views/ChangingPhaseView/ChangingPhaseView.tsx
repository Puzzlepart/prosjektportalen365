import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { Field, ProgressBar } from '@fluentui/react-components'
import { useChangingPhaseView } from './useChangingPhaseView'

export const ChangingPhaseView: FC = () => {
  const { description } = useChangingPhaseView()
  return (
    <Field label={strings.PleaseWaitText} hint={description} validationState='none'>
      <ProgressBar />
    </Field>
  )
}
