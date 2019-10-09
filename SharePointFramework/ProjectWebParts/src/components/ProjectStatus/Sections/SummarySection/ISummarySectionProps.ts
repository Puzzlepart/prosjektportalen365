import { ProjectColumnConfig, SectionModel } from 'shared/lib/models';
import { IBaseSectionProps } from '../BaseSection';

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
