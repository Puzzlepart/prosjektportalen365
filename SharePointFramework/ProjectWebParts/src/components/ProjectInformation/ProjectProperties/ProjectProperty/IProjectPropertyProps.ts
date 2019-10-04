import { DisplayMode } from '@microsoft/sp-core-library';
import { TypedHash } from '@pnp/common';
import { ProjectPropertyModel } from './ProjectPropertyModel';

export interface IProjectPropertyProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * Project property model
     */
    model: ProjectPropertyModel;

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
}