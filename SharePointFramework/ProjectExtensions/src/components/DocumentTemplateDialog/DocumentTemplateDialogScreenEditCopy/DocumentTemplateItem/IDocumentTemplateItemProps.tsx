import { TypedHash } from '@pnp/common';
import { TemplateFile } from 'models/TemplateFile';

export interface IDocumentTemplateItemProps {
    /**
     * @todo Describe property
     */
    model: TemplateFile;

    /**
     * @todo Describe property
     */
    onInputChanged: (id: string, properties: TypedHash<string>, errorMessage?: string) => void;

    /**
     * @todo Describe property
     */
    folderServerRelativeUrl: string;
}
