import { cn } from '@/lib/utils'

interface AIThinkingProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AIThinking({
  message = 'AI is thinking...',
  className,
  size = 'md',
}: AIThinkingProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <div
          className={cn(
            'rounded-full bg-blue-500 animate-bounce',
            dotSize
          )}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={cn(
            'rounded-full bg-blue-500 animate-bounce',
            dotSize
          )}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={cn(
            'rounded-full bg-blue-500 animate-bounce',
            dotSize
          )}
          style={{ animationDelay: '300ms' }}
        />
      </div>
      {message && (
        <span className={cn('text-slate-500 dark:text-slate-400', textSize)}>{message}</span>
      )}
    </div>
  )
}
