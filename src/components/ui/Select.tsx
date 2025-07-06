import React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
}) => {
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button
            className={cn(
              'relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
          >
            <span className="flex items-center">
              {selectedOption?.color && (
                <span
                  className={`inline-block h-3 w-3 rounded-full mr-2 ${selectedOption.color}`}
                />
              )}
              <span className="block truncate">
                {selectedOption?.label || placeholder}
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </span>
          </Listbox.Button>
          <Transition
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    cn(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-blue-600 text-white' : 'text-gray-900'
                    )
                  }
                  value={option.value}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        {option.color && (
                          <span
                            className={`inline-block h-3 w-3 rounded-full mr-2 ${option.color}`}
                          />
                        )}
                        <span
                          className={cn(
                            'block truncate',
                            selected ? 'font-medium' : 'font-normal'
                          )}
                        >
                          {option.label}
                        </span>
                      </div>
                      {selected ? (
                        <span
                          className={cn(
                            'absolute inset-y-0 right-0 flex items-center pr-3',
                            active ? 'text-white' : 'text-blue-600'
                          )}
                        >
                          <CheckIcon className="h-5 w-5" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};