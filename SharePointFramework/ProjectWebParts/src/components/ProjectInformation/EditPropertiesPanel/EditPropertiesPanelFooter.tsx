import { DefaultButton, PrimaryButton } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectInformationContext } from '../context'

export const EditPropertiesPanelFooter: FC<{ onSave: () => Promise<void>; isChanged: boolean }> = ({
  onSave,
  isChanged
}) => {
  const context = useContext(ProjectInformationContext)
  return (
    <div>
      <PrimaryButton text={strings.SaveText} onClick={onSave} disabled={!isChanged} />
      <DefaultButton
        text={strings.CancelText}
        styles={{ root: { marginLeft: 8 } }}
        onClick={() => context.setState({ displayEditPropertiesPanel: false })}
      />
    </div>
  )
}
