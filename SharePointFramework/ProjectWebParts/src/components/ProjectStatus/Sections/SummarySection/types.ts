import { ProjectColumnConfig, SectionModel } from 'shared/lib/models'
import { IBaseSectionProps, IBaseSectionState } from '../BaseSection'

export interface ISummarySectionProps extends IBaseSectionProps {
    /**
     * Sections
     */
    sections: SectionModel[];

    /**
     * Column configuration
     */
    columnConfig: ProjectColumnConfig[];
}


export type ISummarySectionState = IBaseSectionState