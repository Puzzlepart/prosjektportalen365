import { SectionModel } from 'models';
import { ProjectColumnConfig } from 'shared/lib/models';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';
import { IBaseSectionProps } from '../BaseSection';

export interface ISummarySectionProps extends IBaseSectionProps {
    /**
     * @todo describe property
     */
    entity: ISpEntityPortalServiceParams;

    /**
     * @todo describe property
     */
    sections: SectionModel[];

    /**
     * @todo describe property
     */
    columnConfig: ProjectColumnConfig[];
}
