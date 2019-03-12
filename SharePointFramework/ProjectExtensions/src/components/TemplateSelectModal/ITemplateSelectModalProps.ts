
import { IModalProps } from 'office-ui-fabric-react/lib/Modal';
import IProjectSetupApplicationCustomizerData from '../../extensions/projectSetup/IProjectSetupApplicationCustomizerData';

export interface ITemplateSelectModalProps extends IModalProps {
    data: IProjectSetupApplicationCustomizerData;
    onSubmit: (data: IProjectSetupApplicationCustomizerData) => void;
}
