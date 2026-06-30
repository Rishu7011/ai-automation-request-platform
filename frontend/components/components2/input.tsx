
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  labelAction?: ReactNode;
  leadingIcon?: ReactNode;
  trailingAdornment?: ReactNode;
}

export default function Input({
  label,
  id,
  className,
  labelAction,
  leadingIcon,
  trailingAdornment,
  ...inputProps
}: InputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-xs font-semibold tracking-[0.05em] text-[#434655]" htmlFor={id}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative group">
        {leadingIcon && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#434655] transition-colors group-focus-within:text-[#004ac6]">
            {leadingIcon}
          </span>
        )}
        <input
          className={className ?? `w-full rounded-lg border-0 bg-[#f1f5f9] py-3.5 pr-4 ${leadingIcon ? 'pl-11' : 'pl-4'} text-sm text-[#191c1e] placeholder:text-[#737686] transition-all focus:bg-white focus:ring-2 focus:ring-[#004ac6] focus:outline-none`}
          id={id}
          {...inputProps}
        />
        {trailingAdornment && (
          <span className="absolute top-1/2 right-3 -translate-y-1/2">{trailingAdornment}</span>
        )}
      </div>
    </div>
  );
}
