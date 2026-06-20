'use client';

import * as React from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface QuoteItem {
    id: string;
    sku: string;
    description: string;
    quantity: number;
    price: number;
    discount: number; // Percent or fixed? Let's assume % for now based on standard
    taxRate: string; // "0", "7", "10", "15"
    total: number;
}

interface QuoteItemsTableProps {
    items: QuoteItem[];
    onUpdate: (items: QuoteItem[]) => void;
}

export function QuoteItemsTable({ items, onUpdate }: QuoteItemsTableProps) {
    const handleAddItem = () => {
        const newItem: QuoteItem = {
            id: Math.random().toString(36).substring(7),
            sku: '',
            description: '',
            quantity: 1,
            price: 0,
            discount: 0,
            taxRate: '7',
            total: 0,
        };
        onUpdate([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        onUpdate(items.filter((item) => item.id !== id));
    };

    const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
        const updatedItems = items.map((item) => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Recalculate total
                if (field === 'quantity' || field === 'price' || field === 'discount' || field === 'taxRate') {
                    const qty = field === 'quantity' ? Number(value) : item.quantity;
                    const price = field === 'price' ? Number(value) : item.price;
                    const discount = field === 'discount' ? Number(value) : item.discount;

                    const subtotal = qty * price;
                    const discountAmount = subtotal * (discount / 100);
                    const taxableAmount = subtotal - discountAmount;

                    // Simple tax calc (can be complex with map but keeping simple for UI)
                    const taxRate = field === 'taxRate' ? Number(value) : Number(item.taxRate);
                    const taxAmount = taxableAmount * (taxRate / 100);

                    updatedItem.total = taxableAmount + taxAmount;
                }
                return updatedItem;
            }
            return item;
        });
        onUpdate(updatedItems);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[120px]">SKU</TableHead>
                            <TableHead className="min-w-[200px]">Descripción</TableHead>
                            <TableHead className="w-[80px] text-right">Cant.</TableHead>
                            <TableHead className="w-[100px] text-right">Precio</TableHead>
                            <TableHead className="w-[80px] text-right">Desc %</TableHead>
                            <TableHead className="w-[100px] text-right">ITBMS</TableHead>
                            <TableHead className="w-[100px] text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                    No hay items agregados.
                                    <br />
                                    Presiona "Agregar Ítem" para comenzar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Input
                                            value={item.sku}
                                            onChange={(e) => handleUpdateItem(item.id, 'sku', e.target.value)}
                                            className="h-8"
                                            placeholder="SKU"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.description}
                                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                            className="h-8"
                                            placeholder="Descripción del producto"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                                            className="h-8 text-right"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.price || ''}
                                            onChange={(e) => handleUpdateItem(item.id, 'price', Number(e.target.value))}
                                            className="h-8 text-right"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.discount || ''}
                                            onChange={(e) => handleUpdateItem(item.id, 'discount', Number(e.target.value))}
                                            className="h-8 text-right"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={item.taxRate}
                                            onValueChange={(value) => handleUpdateItem(item.id, 'taxRate', value)}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">0%</SelectItem>
                                                <SelectItem value="7">7%</SelectItem>
                                                <SelectItem value="10">10%</SelectItem>
                                                <SelectItem value="15">15%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${item.total.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveItem(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Button variant="outline" onClick={handleAddItem} className="w-full border-dashed">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ítem
            </Button>
        </div>
    );
}
