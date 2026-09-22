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
  'id' | 'title' | 'description' | 'access_level' | 'break_time' | 'created_at'
> {
  organizer: {
    id: number;
    username: string;
  };
  category?: string;
  allowed_list?: number[];
}

export interface LiveSessionDocument extends Document {
  title: string;
  description: string;
  break_time?: BreakTime;
  category: string;
  organizer: {
    id: number;
    username: string;
  };
  access_level: string;
  allowed_list?: number[];
}

export interface CategoryDocument extends Document {
  label: string;
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
      },

      // 가중치가 매우 높게 들어가는 검색의 대상
      title: {
        type: 'text',
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

      // 접근 제어와 작성자 검색용
      organizer: {
        properties: {
          id: { type: 'integer' },
          username: {
            type: 'text',
          },
        },
      },

      // 검색 미활용, 필터링용 (term 쿼리로 정확 일치해야 하므로 keyword)
      access_level: { type: 'keyword' },

      // 검색 미활용, 필터링용
      created_at: { type: 'date' },

      // PRIVATE 접근 제어 필터링용 text array
      allowed_list: { type: 'integer' },
    },
  },
  live_session: {},
  category: {
    // 가중치가 높게 들어가는 검색의 대상
    properties: {
      label: { type: 'keyword' },
    },
  },
};

export default mappings;
