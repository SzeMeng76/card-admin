import * as React from 'react'
import { cn } from '@/lib/utils'

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive'
    size?: 'default' | 'sm' | 'lg'
  }
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
        {
          'bg-gradient-to-br from-zinc-900 to-zinc-800 text-white hover:shadow-lg hover:from-zinc-800 hover:to-zinc-700': variant === 'default',
          'border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-sm': variant === 'outline',
          'hover:bg-zinc-100': variant === 'ghost',
          'bg-gradient-to-br from-red-600 to-red-700 text-white hover:shadow-lg hover:from-red-700 hover:to-red-800': variant === 'destructive',
        },
        {
          'h-10 px-4 py-2 text-sm': size === 'default',
          'h-8 px-3 text-xs': size === 'sm',
          'h-11 px-8 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button }
