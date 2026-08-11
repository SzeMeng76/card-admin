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
          'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-300': variant === 'default',
          'border-2 border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50': variant === 'outline',
          'hover:bg-zinc-100': variant === 'ghost',
          'bg-red-600 text-white shadow-md shadow-red-200 hover:bg-red-700 hover:shadow-lg hover:shadow-red-300': variant === 'destructive',
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
