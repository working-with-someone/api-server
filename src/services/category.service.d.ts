import { PagiNationData } from '../types/pagination';

export type CategorySortKey = 'live_session_count' | 'video_session_count';

export type GetCategoriesInput = PagiNationData & {
  sort: CategorySortKey;
};
