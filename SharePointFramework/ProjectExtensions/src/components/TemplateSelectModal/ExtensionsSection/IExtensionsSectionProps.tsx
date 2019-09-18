import { ProjectTemplate } from '../../../models';
export interface IExtensionsSectionProps {
    extensions: ProjectTemplate[];
    onChange: (obj: {
        selectedExtensions: ProjectTemplate[];
    }) => void;
}
