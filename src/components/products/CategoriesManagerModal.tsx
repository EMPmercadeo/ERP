'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Tags, Pencil, Check, X } from 'lucide-react';

export interface CategoriaItem {
    id: string;
    nombre: string;
    descuentoPorcentaje: number;
}

interface CategoriesManagerModalProps {
    open: boolean;
    onClose: () => void;
    // Se llama cada vez que la lista de categorías cambia (crear/editar/eliminar), para que
    // el filtro y los formularios de producto que ya tienen la lista cargada se refresquen.
    onChanged: (categorias: CategoriaItem[]) => void;
}

export function CategoriesManagerModal({ open, onClose, onChanged }: CategoriesManagerModalProps) {
    const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Formulario de nueva categoría
    const [nombre, setNombre] = useState('');
    const [descuento, setDescuento] = useState('0');
    const [creando, setCreando] = useState(false);

    // Edición inline
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [editNombre, setEditNombre] = useState('');
    const [editDescuento, setEditDescuento] = useState('0');
    const [guardando, setGuardando] = useState(false);

    const cargar = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/categories');
            const data = await res.json().catch(() => ({ items: [] }));
            const items = data.items || [];
            setCategorias(items);
            onChanged(items);
        } catch {
            toast.error('Error al cargar categorías.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        setCreando(true);
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombre.trim(), descuentoPorcentaje: parseFloat(descuento) || 0 })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Categoría "${nombre}" creada.`);
                setNombre('');
                setDescuento('0');
                cargar();
            } else {
                toast.error(data.error || 'No se pudo crear la categoría.');
            }
        } catch {
            toast.error('Error de conexión al crear la categoría.');
        } finally {
            setCreando(false);
        }
    };

    const iniciarEdicion = (cat: CategoriaItem) => {
        setEditandoId(cat.id);
        setEditNombre(cat.nombre);
        setEditDescuento(String(cat.descuentoPorcentaje));
    };

    const guardarEdicion = async (id: string) => {
        setGuardando(true);
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: editNombre.trim(), descuentoPorcentaje: parseFloat(editDescuento) || 0 })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Categoría actualizada.');
                setEditandoId(null);
                cargar();
            } else {
                toast.error(data.error || 'No se pudo actualizar la categoría.');
            }
        } catch {
            toast.error('Error de conexión al actualizar la categoría.');
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async (cat: CategoriaItem) => {
        if (!confirm(`¿Eliminar la categoría "${cat.nombre}"? Los productos que la tengan asignada quedarán sin categoría.`)) return;
        try {
            const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                toast.success('Categoría eliminada.');
                cargar();
            } else {
                toast.error(data.error || 'No se pudo eliminar la categoría.');
            }
        } catch {
            toast.error('Error de conexión al eliminar la categoría.');
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Tags className="h-4.5 w-4.5 text-brand-1" />
                        <h3 className="text-sm font-bold text-foreground">Gestionar Categorías y sus Descuentos</h3>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-border shrink-0">
                    <form onSubmit={handleCrear} className="flex items-end gap-2">
                        <div className="flex-1">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nueva categoría</Label>
                            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Bebidas, Ferretería..." className="h-9 text-xs" required />
                        </div>
                        <div className="w-24">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Desc. %</Label>
                            <Input type="number" min={0} max={100} step={0.5} value={descuento} onChange={(e) => setDescuento(e.target.value)} className="h-9 text-xs" />
                        </div>
                        <Button type="submit" disabled={creando} size="sm" className="h-9">
                            {creando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center text-xs text-muted-foreground py-8">Cargando categorías...</div>
                    ) : categorias.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground py-8">No hay categorías todavía. Crea la primera arriba.</div>
                    ) : (
                        categorias.map((cat) => (
                            <div key={cat.id} className="flex items-center gap-2 border border-border rounded-lg p-2.5">
                                {editandoId === cat.id ? (
                                    <>
                                        <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="h-8 text-xs flex-1" />
                                        <Input type="number" min={0} max={100} step={0.5} value={editDescuento} onChange={(e) => setEditDescuento(e.target.value)} className="h-8 text-xs w-20" />
                                        <Button size="icon" variant="ghost" aria-label="Guardar cambios de la categoría" className="h-8 w-8 text-success" disabled={guardando} onClick={() => guardarEdicion(cat.id)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" aria-label="Cancelar edición" className="h-8 w-8 text-muted-foreground" onClick={() => setEditandoId(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1 text-xs font-semibold text-foreground truncate">{cat.nombre}</span>
                                        <Badge variant={cat.descuentoPorcentaje > 0 ? 'info' : 'neutral'} className="text-[10px] shrink-0">
                                            {cat.descuentoPorcentaje > 0 ? `${cat.descuentoPorcentaje}% desc.` : 'Sin descuento'}
                                        </Badge>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-brand-1" onClick={() => iniciarEdicion(cat)} aria-label={`Editar categoría ${cat.nombre}`}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleEliminar(cat)} aria-label={`Eliminar categoría ${cat.nombre}`}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-border shrink-0">
                    <Button variant="outline" onClick={onClose} className="w-full">Cerrar</Button>
                </div>
            </div>
        </div>
    );
}
