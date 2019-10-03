import { IProjectSetupApplicationCustomizerData } from '../../extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps';
import { ITemplateSelectDialogState } from './ITemplateSelectDialogState';

export interface ITemplateSelectDialogProps extends IBaseDialogProps {
    /**
     * @todo Describe property
     */
    data: IProjectSetupApplicationCustomizerData;

    /**
     * @todo Describe property
     */
    onSubmit: (state: ITemplateSelectDialogState) => void;
}
