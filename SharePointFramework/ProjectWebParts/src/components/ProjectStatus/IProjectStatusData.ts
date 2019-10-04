import { ProjectColumnConfig, SectionModel, StatusReport, SPField } from 'shared/lib/models';
import { IEntity } from 'sp-entityportal-service';

export interface IProjectStatusData {
    /**
     * Entity item
     */
    entity?: IEntity;

    /**
     * Status report fields
     */
    reportFields?: SPField[];

    /**
     * Default edit form URL for status reports
     */
    reportEditFormUrl?: string;

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
