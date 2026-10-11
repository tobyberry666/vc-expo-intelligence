// EXPORTS: IInvestment
export interface IInvestment {
  id: string
  company: string
  institution: string
  sector: string
  round: string
  amount: string
  date: string
  summary: string
  imageUrl: string
  sourceName?: string
  sourceUrl?: string
  exhibitorCountKnown?: boolean
  source?: 'live'
}
