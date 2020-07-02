import { ProjectColumnConfig, SectionModel, SPField, StatusReport } from 'shared/lib/models'
import { IGetPropertiesData } from 'shared/lib/services'

export interface IProjectStatusData {
    /**
     * Entity item
     */
    properties?: IGetPropertiesData;

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
