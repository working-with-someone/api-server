import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import { Indices } from './indices';
import { PublicVideoSession } from '../../types/contracts/video-session';

export interface BreakTime {
  interval?: number;
  duration?: number;
}

export interface Document {
  id: string;
}

export interface VideoSessionDocument extends Pick<
  PublicVideoSession,
  | 'id'
  | 'title'
  | 'description'
  | 'access_level'
  | 'break_time'
  | 'category'
  | 'created_at'
> {
  organizer_username: string;
  allowed_list?: number[];
}

export interface LiveSessionDocument extends Document {
  title: string;
  description: string;
  break_time?: BreakTime;
  category: string;
  organizer_username: string;
  access_level: string;
  allowed_list?: number[];
}

const mappings: { [key in Indices]: MappingTypeMapping } = {
  video_session: {
    properties: {
      // 검색 대상 아님 (필터링 또는 식별용)
      id: {
        type: 'keyword',
      },

      // 가중치가 높게 들어가는 검색의 대상
      description: {
        type: 'text',
        boost: 2.0,
      },

      // 가중치가 매우 높게 들어가는 검색의 대상
      title: {
        type: 'text',
        boost: 5.0,
      },

      // 검색 미활용, 필터 검색용
      duration: { type: 'integer' },

      // 검색 미활용, 필터 검색용
      break_time: {
        type: 'object',
        properties: {
          interval: { type: 'integer' },
          duration: { type: 'integer' },
        },
      },

      // 일반 검색 미활용, 카테고리 태그 검색용
      category: {
        type: 'keyword',
      },

      // 검색 미활용, 필터 정렬용
      // like_count: { type: 'integer' },

      // 가중치가 들어가는 검색의 대상
      organizer_username: {
        boost: 1.0,
        type: 'keyword',
      },

      // 검색 미활용, 필터링용
      access_level: { type: 'keyword' },

      // 검색 미활용, 필터링용
      created_at: { type: 'date' },

      // PRIVATE 접근 제어 필터링용 text array
      allowed_list: { type: 'integer' },
    },
  },
  live_session: {},
};

export default mappings;
