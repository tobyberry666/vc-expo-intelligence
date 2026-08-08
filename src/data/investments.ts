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
  source?: 'live'
}
