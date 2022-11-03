import { useState } from 'react'
import { IPropertyFieldColorConfigurationProps } from '../../types'

export function usePropertyFieldColorConfiguration(props: IPropertyFieldColorConfigurationProps) {
    const [config] = useState(props.value)
    const [value, setValue] = useState(config.length)
    return { config, value, setValue } as const
}
