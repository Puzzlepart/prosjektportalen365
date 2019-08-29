import { ProjectStatusReport, SectionModel } from 'models';
import { ProjectColumnConfig } from 'shared/lib/models';

export interface IProjectStatusData {
    /**
     * @todo describe property
     */
    entityFields?: any[];

    /**
     * @todo describe property
     */
    entityItem?: any;
    
    /**
     * @todo describe property
     */
    defaultEditFormUrl?: string;
    
    /**
     * @todo describe property
     */
    reports?: ProjectStatusReport[];
    
    /**
     * @todo describe property
     */
    sections?: SectionModel[];
    
    /**
     * @todo describe property
     */
    columnConfig?: ProjectColumnConfig[];
}
