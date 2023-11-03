import { DataGridProps } from '@fluentui/react-components'

export interface IProjectListProps {
    items: Record<string, any>[];
    onSelectionChange: DataGridProps['onSelectionChange']
}