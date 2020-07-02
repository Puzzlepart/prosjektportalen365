import { DisplayMode } from '@microsoft/sp-core-library'
import { TypedHash } from '@pnp/common'
import { ProjectPropertyModel } from './ProjectPropertyModel'

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
     * On field external changed
     */
    onFieldExternalChanged?: (fieldName: string, checked: boolean) => void;

    /**
     * A hash object of fields to show for external users
     */
    showFieldExternal?: TypedHash<boolean>;
}