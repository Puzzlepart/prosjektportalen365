import { PrimaryButton } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { ClosePanelButton } from '../BasePanel'
import { useModel } from './useModel'

export const EditPropertiesPanelFooter: FC<{
  onSave: () => Promise<void>
  model: ReturnType<typeof useModel>
}> = ({ onSave, model }) => {
  return (
    <div>
      <PrimaryButton text={strings.SaveText} onClick={onSave} disabled={!model.isChanged} />
      <ClosePanelButton
        onClick={() => {
          model.reset()
        }}
      />
    </div>
  )
}
