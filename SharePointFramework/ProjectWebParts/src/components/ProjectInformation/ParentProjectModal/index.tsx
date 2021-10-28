import React, { FunctionComponent, useState } from 'react'
import { Dialog, DialogType, DialogFooter, PrimaryButton, DefaultButton, Spinner, SpinnerSize } from 'office-ui-fabric-react'
import { sp } from '@pnp/sp'
import { userCustomAction, ParentModalProps } from './types'

export const CreateParentModal: FunctionComponent<ParentModalProps> = ({ isOpen, onDismiss }) => {
    const [isLoading, setLoading] = useState(false)

    async function applyCustomAction() {
        setLoading(true)

        await sp.web.userCustomActions.add(userCustomAction);
        location.reload()
    }

    return (
        <>
            <Dialog hidden={!isOpen} onDismiss={onDismiss} dialogContentProps={dialogContentProps}>
                {!isLoading && <DialogFooter>
                    <PrimaryButton text="Gjør om" onClick={() => applyCustomAction()} />
                    <DefaultButton text="Avbryt" onClick={() => onDismiss()} />
                </DialogFooter>}
                {isLoading && <Spinner size={SpinnerSize.medium} />}
            </Dialog>
        </>
    )
}


const dialogContentProps = {
    type: DialogType.largeHeader,
    title: 'Overordnet prosjekt',
    subText: 'Ønsker du å gjøre om prosjektet til et overordnet prosjekt? Denne handlingen er ikke reversibel.',
};
