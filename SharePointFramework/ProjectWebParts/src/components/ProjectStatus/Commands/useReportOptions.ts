import { IContextualMenuItem } from '@fluentui/react'
import { formatDate } from 'pp365-shared/lib/helpers'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'

export function useReportOptions() {
    const context = useContext(ProjectStatusContext)
    const reportOptions: IContextualMenuItem[] = context.state.data.reports.map((report) => {
        const isCurrent = context.state.selectedReport
            ? report.id === context.state.selectedReport.id
            : false
        return {
            key: `${report.id}`,
            name: formatDate(report.created, true),
            onClick: () => {
                context.setState({ selectedReport: report })
            },
            canCheck: true,
            iconProps: {
                iconName: report.published ? 'BoxCheckmarkSolid' : 'CheckboxFill',
                style: {
                    color: report.published ? '#2DA748' : '#D2D2D2'
                }
            },
            isChecked: isCurrent
        } as IContextualMenuItem
    })
    return reportOptions

}
