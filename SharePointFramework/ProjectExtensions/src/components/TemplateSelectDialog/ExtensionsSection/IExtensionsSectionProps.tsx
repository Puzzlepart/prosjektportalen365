import { ProjectTemplate } from '../../../models/index';
export interface IExtensionsSectionProps {
    extensions: ProjectTemplate[];
    onChange: (obj: {
        selectedExtensions: ProjectTemplate[];
    }) => void;
}
