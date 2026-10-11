// EXPORTS: IExpo
export interface IExpo {
  id: string
  name: string
  type: 'consumer' | 'ai' | 'auto' | 'industrial'
  startDate: string
  endDate: string
  location: string
  chineseExhibitorCount: number
  imageUrl: string
  description: string
  exhibitors?: string[]
  sourceName?: string
  sourceUrl?: string
  exhibitorCountKnown?: boolean
  source?: 'live'
}
