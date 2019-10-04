import { ProjectExtension } from '../../../models';

export interface IExtensionsSectionProps {
    /**
     * Extensions
     */
    extensions?: ProjectExtension[];

    /**
     * Currently selected extensions
     */
    selectedExtensions?: ProjectExtension[];

    /**
     * On extensions changed
     */
    onChange: (selectedExtensions: ProjectExtension[]) => void;
}
