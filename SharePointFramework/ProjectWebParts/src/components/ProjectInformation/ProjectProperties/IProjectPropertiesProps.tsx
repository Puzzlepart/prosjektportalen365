import { DisplayMode } from '@microsoft/sp-core-library';
import { ProjectPropertyModel } from './ProjectProperty';
import { TypedHash } from '@pnp/common';

export interface IProjectPropertiesProps {
    /**
     * Title of the web part
     */
    title?: string;

    /**
     * Properties
     */
    properties?: ProjectPropertyModel[];

    /**
     * Is the current user site admin
     */
    isSiteAdmin: boolean;

    /**
     * Display mode
     */
    displayMode?: DisplayMode;

    /**
     * @todo Describe property
     */
    onFieldExternalChanged?: (fieldName: string, checked: boolean) => void;

    /**
     * @todo Describe property
     */
    showFieldExternal?: TypedHash<boolean>;

    /**
     * @todo Describe property
     */
    localList?: boolean;
}
