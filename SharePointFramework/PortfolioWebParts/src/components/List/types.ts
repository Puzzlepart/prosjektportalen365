import { IShimmeredDetailsListProps } from '@fluentui/react'
import { WebPartContext } from '@microsoft/sp-webpart-base'

export interface IListProps extends IShimmeredDetailsListProps {
    isAddColumnEnabled?: boolean
    webPartContext?: WebPartContext
}