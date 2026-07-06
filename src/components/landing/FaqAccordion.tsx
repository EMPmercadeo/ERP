'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItem {
    question: string;
    answer: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="mx-auto max-w-3xl divide-y divide-brand-3/10 rounded-xl border border-brand-3/10 bg-white">
            {items.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                    <div key={item.question}>
                        <button
                            type="button"
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                            onClick={() => setOpenIndex(isOpen ? null : index)}
                            aria-expanded={isOpen}
                        >
                            <span className="text-sm font-semibold text-brand-3 sm:text-base">{item.question}</span>
                            <ChevronDown
                                className={cn(
                                    'h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200',
                                    isOpen && 'rotate-180'
                                )}
                            />
                        </button>
                        {isOpen && (
                            <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                                {item.answer}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
