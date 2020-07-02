import { IPhaseChecklistItem } from '../models'

export type PhaseChecklistData = {
    stats?: {
        [status: string]: number;
    };
    items?: IPhaseChecklistItem[];
};
