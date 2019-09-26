import { TemplateFile } from 'models/TemplateFile';

export interface IDocumentTemplateItemProps {
    /**
     * @todo Describe property
     */
    model: TemplateFile;

    /**
     * @todo Describe property
     */
    onInputChanged: (id: string, properties: { newName?: string; newTitle?: string; }) => void;
}
