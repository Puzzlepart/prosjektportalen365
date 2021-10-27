import React, { FunctionComponent, useState } from 'react'
import { Dialog, DialogType, DialogFooter, PrimaryButton, DefaultButton, Spinner, SpinnerSize } from 'office-ui-fabric-react'
import { sp } from '@pnp/sp'

interface ParentModalProps {
    isOpen: boolean;
    onDismiss: () => void
}

export const CreateParentModal: FunctionComponent<ParentModalProps> = ({ isOpen, onDismiss }) => {
    const [isLoading, setLoading] = useState(false)

    async function applySiteDesign() {
        setLoading(true)

        await sp.siteDesigns.applySiteDesign("bf3dfdb8-abc7-4f27-97f5-5ae9b26477bd", window.location.href)
        location.reload()

    }

    return (
        <>
            <Dialog hidden={!isOpen} onDismiss={onDismiss} dialogContentProps={dialogContentProps}>
                {!isLoading && <DialogFooter>
                    <PrimaryButton text="Gjør om" onClick={() => applySiteDesign()} />
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
