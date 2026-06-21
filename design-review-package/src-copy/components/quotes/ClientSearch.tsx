'use client';

import * as React from 'react';
import { Search, Loader2, User, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Client {
    id: string;
    razonSocial: string;
    ruc: string;
    dv?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
}

interface ClientSearchProps {
    onSelect: (client: Client) => void;
    className?: string;
}

export function ClientSearch({ onSelect, className }: ClientSearchProps) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<Client[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    // Debounce logic manually to ensure control
    const [debouncedQuery, setDebouncedQuery] = React.useState(query);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(handler);
    }, [query]);

    // Search effect
    React.useEffect(() => {
        const controller = new AbortController();

        const searchClients = async () => {
            // Allow empty query for default suggestions
            // if (debouncedQuery.length < 2) ... removed check to allow empty

            setLoading(true);
            setError(null);
            // setIsOpen(true); // Don't auto open on every debounce change if it's closed, only if intentional? 
            // Actually user wants it to just work. Let's keep isOpen logic in input handlers mostly, but if we have results we might want to ensure it is open if focused.

            try {
                // If query is empty -> API returns default 3
                const res = await fetch(`/api/customers/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`, {
                    signal: controller.signal
                });

                if (!res.ok) throw new Error('Error buscando clientes');

                const json = await res.json();
                setResults(json.data || []);
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                setError('Error buscando clientes');
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        // Trigger search always on debounce change (even empty)
        searchClients();

        return () => controller.abort();
    }, [debouncedQuery]);

    const handleSelect = (client: Client) => {
        setQuery(client.razonSocial);
        setIsOpen(false);
        onSelect(client);
    };

    return (
        <div className={cn("relative w-full", className)}>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Buscar cliente por nombre, RUC o correo..."
                    className="pl-8"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true); // Always open on type
                    }}
                    onFocus={() => {
                        setIsFocused(true);
                        setIsOpen(true); // Open on focus to show defaults
                        // If empty, debouncedQuery is already empty, effect will run or has run. 
                        // If we want to ensure a refresh, we could rely on the existing state if it's already there.
                    }}
                    onBlur={() => {
                        // Delay closing to allow click on items
                        setTimeout(() => {
                            setIsFocused(false);
                            setIsOpen(false);
                        }, 200);
                    }}
                />
                {loading && (
                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {isOpen && (isFocused || loading || results.length > 0 || error) && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                    <div className="max-h-[260px] overflow-y-auto p-1">
                        {loading && results.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Buscando...
                            </div>
                        )}

                        {error && (
                            <div className="flex flex-col items-center justify-center py-6 text-sm text-destructive gap-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{error}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7"
                                    onClick={() => setDebouncedQuery(query)} // Retry
                                >
                                    Reintentar
                                </Button>
                            </div>
                        )}

                        {!loading && !error && results.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No se encontraron resultados para "{query}"
                            </div>
                        )}

                        {!loading && !error && results.length > 0 && results.map((client) => (
                            <div
                                key={client.id}
                                className={cn(
                                    "relative flex cursor-default select-none items-start gap-3 rounded-sm px-2 py-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                )}
                                onClick={() => handleSelect(client)}
                            >
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 flex-1">
                                    <span className="font-medium leading-none">
                                        {client.razonSocial}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-mono">{client.ruc}{client.dv && `-${client.dv}`}</span>
                                        {client.email && (
                                            <>
                                                <span>•</span>
                                                <span className="truncate max-w-[150px]">{client.email}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
