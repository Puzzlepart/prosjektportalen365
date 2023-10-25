import { Dropdown, Option, OptionProps } from '@fluentui/react-components'
import React, { useEffect, useState } from 'react'
import { FieldContainer } from '../../FieldContainer'
import { FieldElementComponent } from './types'
import { useCustomEditPanelContext } from '../context'

export const Lookup: FieldElementComponent = ({ field }) => {
    const context = useCustomEditPanelContext()
    const [options, setOptions] = useState<OptionProps[]>([])
    useEffect(() => {
        console.log(field.internalName)
        context.props.targetWeb.lists.getById(field.LookupList).items.select('Id', field.LookupField).getAll().then((items) => {
            setOptions(items.map((item) => ({
                key: item.Id,
                value: item.Id,
                text: item[field.LookupField]
            })))
        })
    }, [])
    return (
        <FieldContainer iconName='Link' label={field.displayName} description={field.description}>
            <Dropdown>
                {options.map((option) => (
                    <Option key={option.key} value={option.value}>
                        {option.text}
                    </Option>
                ))}
            </Dropdown>
        </FieldContainer>
    )
}