import { IRenderItemColumnProps } from 'pp365-shared-library'

/** Project-information cell options, including the panel's page context. */
export interface IProjectInformationColumnProps extends IRenderItemColumnProps {
  page?: 'Frontpage' | 'ProjectStatus' | 'Portfolio'
  iconName?: string
  iconStyles?: React.CSSProperties
}
