'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

type DialogType = 'confirm' | 'prompt';

interface DialogOptions {
  message: string;
  type: DialogType;
  defaultValue?: string;
}

interface DialogContextValue {
  confirm: (message: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [inputValue, setInputValue] = useState('');
  
  const resolver = useRef<((value: boolean | string | null) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({ message, type: 'confirm' });
      setIsOpen(true);
      resolver.current = resolve as (value: boolean | string | null) => void;
    });
  }, []);

  const prompt = useCallback((message: string, defaultValue = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      setOptions({ message, type: 'prompt', defaultValue });
      setInputValue(defaultValue);
      setIsOpen(true);
      resolver.current = resolve as (value: boolean | string | null) => void;
    });
  }, []);

  const handleClose = (value: boolean | string | null) => {
    setIsOpen(false);
    if (resolver.current) {
      resolver.current(value);
      resolver.current = null;
    }
    setTimeout(() => {
      setOptions(null);
      setInputValue('');
    }, 300);
  };

  useEffect(() => {
    if (isOpen && options?.type === 'prompt') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, options]);

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      
      {isOpen && options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]" 
            onClick={() => handleClose(options.type === 'confirm' ? false : null)}
          />
          
          <div className="relative w-full max-w-sm bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-[modalUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="p-5 lg:p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {options.message}
              </h3>
              
              {options.type === 'prompt' && (
                <div className="mb-5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-all text-white placeholder-white/30"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleClose(inputValue);
                      if (e.key === 'Escape') handleClose(null);
                    }}
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => handleClose(options.type === 'confirm' ? false : null)}
                  className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-white/10 focus:ring-2 focus:ring-accent focus:outline-none active:scale-95"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  İptal
                </button>
                <button
                  onClick={() => handleClose(options.type === 'confirm' ? true : inputValue)}
                  className="px-5 py-2.5 rounded-xl font-medium bg-accent text-white hover:bg-accent/80 transition-colors focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-[#1a1a1a] focus:outline-none active:scale-95"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
