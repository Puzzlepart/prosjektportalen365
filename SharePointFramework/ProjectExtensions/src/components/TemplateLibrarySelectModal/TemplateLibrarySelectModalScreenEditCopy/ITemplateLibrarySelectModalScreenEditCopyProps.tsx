import { TemplateFile } from "../../../models";

export interface ITemplateLibrarySelectModalScreenEditCopyProps {
    selectedTemplates: TemplateFile[];
    onStartCopy: (templates: TemplateFile[]) => void;
    onGoBack: () => void;
}
