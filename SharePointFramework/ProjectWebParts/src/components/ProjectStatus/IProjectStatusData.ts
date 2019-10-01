import { ProjectColumnConfig, SectionModel, StatusReport } from 'shared/lib/models';
import { IEntity } from 'sp-entityportal-service';

export interface IProjectStatusData {
    /**
     * Entity item
     */
    entity?: IEntity;

    /**
     * Default edit form URL for status reports
     */
    defaultEditFormUrl?: string;

    /**
     * Reports
     */
    reports?: StatusReport[];

    /**
     * Sections
     */
    sections?: SectionModel[];

    /**
     * Column configuration
     */
    columnConfig?: ProjectColumnConfig[];
}
