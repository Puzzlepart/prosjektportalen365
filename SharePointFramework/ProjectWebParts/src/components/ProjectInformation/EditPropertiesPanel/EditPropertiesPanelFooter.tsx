import { DefaultButton, PrimaryButton } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import { useEditPropertiesPanelModel } from './useEditPropertiesPanelModel'

export const EditPropertiesPanelFooter: FC<{
  onSave: () => Promise<void>
  model: ReturnType<typeof useEditPropertiesPanelModel>
}> = ({ onSave, model }) => {
  const context = useProjectInformationContext()
  return (
    <div>
      <PrimaryButton text={strings.SaveText} onClick={onSave} disabled={!model.isChanged} />
      <DefaultButton
        text={strings.CancelText}
        styles={{ root: { marginLeft: 8 } }}
        onClick={() => {
          model.reset()
          context.setState({ displayEditPropertiesPanel: false })
        }}
      />
    </div>
  )
}
