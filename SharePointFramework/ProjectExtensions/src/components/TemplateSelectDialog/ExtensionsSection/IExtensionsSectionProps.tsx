import { ProjectTemplate } from '../../../models';

export interface IExtensionsSectionProps {
    /**
     * Extensions
     */
    extensions?: ProjectTemplate[];

    /**
     * Currently selected extensions
     */
    selectedExtensions?: ProjectTemplate[];

    /**
     * On extensions changed
     */
    onChange: (selectedExtensions: ProjectTemplate[]) => void;
}
