import { IRenderItemColumnProps } from '../types'

export interface IProjectInformationColumnProps extends IRenderItemColumnProps {
    page?: 'Frontpage' | 'ProjectStatus' | 'Portfolio'
    iconName?: string
    iconStyles?: React.CSSProperties
}