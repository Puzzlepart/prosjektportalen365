import { DisplayMode } from '@microsoft/sp-core-library'
import { TypedHash } from '@pnp/common'
import { ProjectPropertyModel } from './ProjectProperty'

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
     * Does the web have a local project properties list
     */
    propertiesList: boolean;

    /**
     * On external field changed
     */
    onFieldExternalChanged?: (fieldName: string, checked: boolean) => void;

    /**
     * A hash object of fields to show for external users
     */
    showFieldExternal?: TypedHash<boolean>;
}
