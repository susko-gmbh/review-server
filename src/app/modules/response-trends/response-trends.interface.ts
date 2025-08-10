export type TResponseTrendsPeriod = '7d' | '30d' | '3m';

export interface TResponseTrendData {
  period: string;
  responseTime: number;
  replyRate: number;
  date: string;
  totalReviews: number;
  repliedReviews: number;
}

export interface TResponseTrendsQuery {
  period?: TResponseTrendsPeriod;
  profileId?: string;
}

export interface TResponseTrendsResponse {
  success: boolean;
  message: string;
  data: TResponseTrendData[];
}