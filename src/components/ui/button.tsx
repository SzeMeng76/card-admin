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
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-zinc-900 text-white hover:bg-zinc-700': variant === 'default',
          'border border-zinc-300 bg-white hover:bg-zinc-50': variant === 'outline',
          'hover:bg-zinc-100': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
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
