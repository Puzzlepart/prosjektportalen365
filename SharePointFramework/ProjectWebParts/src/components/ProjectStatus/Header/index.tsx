import { WebPartTitle } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useHeader } from './useHeader'

export const Header: FC = () => {
    const { title } = useHeader()
    return (
        <WebPartTitle title={title} />
    )
}