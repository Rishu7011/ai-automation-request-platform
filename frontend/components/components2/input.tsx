
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
        <label className="block text-xs font-semibold tracking-[0.05em] text-[#908fa0] uppercase font-outfit" htmlFor={id}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative group">
        {leadingIcon && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#908fa0] transition-colors group-focus-within:text-[#c0c1ff]">
            {leadingIcon}
          </span>
        )}
        <input
          className={className ?? `w-full rounded-xl border border-[#464554]/40 bg-[#1f1f27] py-3.5 pr-4 ${leadingIcon ? 'pl-11' : 'pl-4'} text-sm text-[#e4e1ed] placeholder:text-[#908fa0] transition-all focus:bg-[#282834] focus:ring-2 focus:ring-[#6366f1] focus:outline-none [color-scheme:dark]`}
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
