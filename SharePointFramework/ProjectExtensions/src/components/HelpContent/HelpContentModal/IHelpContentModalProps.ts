import { HelpContentModel } from '../../../models/HelpContentModel';
import { IModalProps } from 'office-ui-fabric-react/lib/Modal';

export interface IHelpContentModalProps extends IModalProps {
    content: HelpContentModel[];
}
