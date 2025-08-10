export type TReviewTrendsPeriod = '7d' | '30d' | '3m' | '12m';

export interface TReviewTrendData {
  period: string;
  count: number;
  date: string;
}

export interface TReviewTrendsQuery {
  period?: TReviewTrendsPeriod;
  profileId?: string;
}

export interface TReviewTrendsResponse {
  success: boolean;
  message: string;
  data: TReviewTrendData[];
}