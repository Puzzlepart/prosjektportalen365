import React, { FunctionComponent, useState } from 'react'
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  Spinner,
  SpinnerSize
} from 'office-ui-fabric-react'
import { SyncModalProps } from './types'

export const SyncProjectModal: FunctionComponent<SyncModalProps> = ({ isOpen, onDismiss }) => {
  const [isLoading] = useState(false)

  return (
    <>
      <Dialog
        hidden={!isOpen}
        onDismiss={onDismiss}
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: 'Overordnet område',
          subText:
            'Ønsker du å gjøre om området til et overordnet område? Denne handlingen er ikke reversibel.'
        }}>
        {!isLoading && (
          <DialogFooter>
            <DefaultButton text='Avbryt' onClick={() => onDismiss()} />
            <PrimaryButton
              text='Synkroniser'
              onClick={() => {
                console.log('test')
              }}
            />
          </DialogFooter>
        )}
        {isLoading && <Spinner size={SpinnerSize.medium} />}
      </Dialog>
    </>
  )
}
