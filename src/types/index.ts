export * from './learn'

export interface PanicModeItem {
  title: string
  type: 'framework' | 'story' | 'tip' | 'question' | 'talking_point'
  content: string
  priority: number
}
