import { IRenderItemColumnProps } from 'pp365-shared-library'

export interface IProjectInformationColumnProps extends IRenderItemColumnProps {
  page?: 'Frontpage' | 'ProjectStatus' | 'Portfolio'
  iconName?: string
  iconStyles?: React.CSSProperties
}
