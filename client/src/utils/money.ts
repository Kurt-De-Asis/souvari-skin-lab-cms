import { formatAmountInput, parseAmountInput } from './format';

type RegisterLike<T> = (
  name: keyof T,
  options?: Record<string, any>,
) => {
  name: string;
  onChange: (event: any) => void;
  onBlur: (...args: any[]) => void;
  ref: (instance: any) => void;
};

export function registerMoney<T>(register: RegisterLike<T>, name: keyof T, options?: Record<string, any>) {
  const opts = options || {};
  if (('valueAsNumber' in opts)) delete opts.valueAsNumber;
  opts.setValueAs = parseAmountInput;
  const registration = register(name, opts);
  return {
    ...registration,
    onChange: (e: any) => {
      e.target.value = formatAmountInput(e.target.value);
      return registration.onChange(e);
    },
  };
}