/* eslint-disable jsx-a11y/alt-text */
'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a standard font (Helvetica is built-in, but Inter or Roboto is nicer if custom loaded. 
// For simplicity and speed, we'll use Helvetica which is standard in PDF.)

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 20,
    },
    logoSection: {
        width: '50%',
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 5,
    },
    companyInfo: {
        fontSize: 9,
        color: '#666666',
        lineHeight: 1.4,
    },
    quoteInfoSection: {
        width: '40%',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    infoLabel: {
        color: '#666666',
        width: 80,
        textAlign: 'right',
        marginRight: 10,
        fontWeight: 'bold',
    },
    infoValue: {
        textAlign: 'right',
        width: 100,
    },
    clientSection: {
        marginBottom: 30,
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#111827',
        textTransform: 'uppercase',
    },
    clientGrid: {
        flexDirection: 'row',
        gap: 40,
    },
    clientColumn: {
        flex: 1,
    },
    clientText: {
        fontSize: 10,
        marginBottom: 3,
        lineHeight: 1.4,
    },
    tableContainer: {
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    colDesc: { flex: 2, textAlign: 'left' },
    colQty: { width: 50, textAlign: 'center' },
    colPrice: { width: 80, textAlign: 'right' },
    colDisc: { width: 60, textAlign: 'right' },
    colTax: { width: 60, textAlign: 'right' },
    colTotal: { width: 80, textAlign: 'right' },
    
    headerText: {
        fontWeight: 'bold',
        fontSize: 9,
        color: '#374151',
    },
    
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 30,
    },
    totalsBox: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        paddingBottom: 2,
    },
    totalLabel: {
        color: '#666666',
    },
    totalValue: {
        textAlign: 'right',
        fontWeight: 'bold',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 2,
        borderTopColor: '#000000',
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    grandTotalValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 20,
    },
    disclaimer: {
        fontSize: 8,
        color: '#9CA3AF',
        marginBottom: 5,
    },
    terms: {
        fontSize: 9,
        marginTop: 10,
        textAlign: 'left',
        color: '#4B5563',
        fontStyle: 'italic',
    }
});

interface QuotePDFProps {
    data: {
        quoteNumber: string;
        date: string;
        validUntil: string;
        salesperson: string;
        company: {
            name: string;
            ruc: string;
            address: string;
            phone: string;
            email: string;
        };
        client: {
            name: string;
            ruc: string;
            address: string;
            phone?: string;
            email?: string;
        };
        items: Array<{
            sku: string;
            description: string;
            quantity: number;
            price: number;
            discount: number;
            taxRate: string;
            total: number;
        }>;
        totals: {
            subtotal: number;
            discount: number;
            tax: number;
            total: number;
        };
        terms: string;
        notes: string;
    }
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const QuotePDF = ({ data }: QuotePDFProps) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        <Text style={styles.logoText}>{data.company.name}</Text>
                        <Text style={styles.companyInfo}>RUC: {data.company.ruc}</Text>
                        <Text style={styles.companyInfo}>{data.company.address}</Text>
                        <Text style={styles.companyInfo}>Tel: {data.company.phone} | Email: {data.company.email}</Text>
                    </View>
                    <View style={styles.quoteInfoSection}>
                        <Text style={styles.title}>Cotización</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Número:</Text>
                            <Text style={styles.infoValue}>{data.quoteNumber}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Fecha:</Text>
                            <Text style={styles.infoValue}>{data.date}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Válida hasta:</Text>
                            <Text style={styles.infoValue}>{data.validUntil}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Vendedor:</Text>
                            <Text style={styles.infoValue}>{data.salesperson}</Text>
                        </View>
                    </View>
                </View>

                {/* Client Info */}
                <View style={styles.clientSection}>
                    <Text style={styles.sectionTitle}>Cliente</Text>
                    <View style={styles.clientGrid}>
                        <View style={styles.clientColumn}>
                            <Text style={styles.clientText}><Text style={{fontWeight:'bold'}}>Razón Social:</Text> {data.client.name}</Text>
                            <Text style={styles.clientText}><Text style={{fontWeight:'bold'}}>RUC/DV:</Text> {data.client.ruc}</Text>
                        </View>
                        <View style={styles.clientColumn}>
                            <Text style={styles.clientText}><Text style={{fontWeight:'bold'}}>Dirección:</Text> {data.client.address}</Text>
                            <Text style={styles.clientText}><Text style={{fontWeight:'bold'}}>Contacto:</Text> {data.client.phone} {data.client.email ? `| ${data.client.email}` : ''}</Text>
                        </View>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.tableContainer}>
                    {/* Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colDesc, styles.headerText]}>Descripción</Text>
                        <Text style={[styles.colQty, styles.headerText]}>Cant</Text>
                        <Text style={[styles.colPrice, styles.headerText]}>Precio</Text>
                        <Text style={[styles.colDisc, styles.headerText]}>Desc %</Text>
                        <Text style={[styles.colTax, styles.headerText]}>ITBMS</Text>
                        <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
                    </View>

                    {/* Rows */}
                    {data.items.map((item, index) => {
                        const lineSub = item.price * item.quantity;
                        const lineVal = lineSub - (lineSub * (item.discount / 100)); // Value after discount before tax
                        const taxVal = lineVal * (Number(item.taxRate) / 100);
                        
                        return (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.colDesc}>{item.description}</Text>
                                <Text style={styles.colQty}>{item.quantity}</Text>
                                <Text style={styles.colPrice}>${formatCurrency(item.price)}</Text>
                                <Text style={styles.colDisc}>{item.discount}%</Text>
                                <Text style={styles.colTax}>${formatCurrency(taxVal)}</Text>
                                <Text style={styles.colTotal}>${formatCurrency(item.total)}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>${formatCurrency(data.totals.subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Descuento:</Text>
                            <Text style={[styles.totalValue, {color: '#DC2626'}]}>-${formatCurrency(data.totals.discount)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>ITBMS:</Text>
                            <Text style={styles.totalValue}>${formatCurrency(data.totals.tax)}</Text>
                        </View>
                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
                            <Text style={styles.grandTotalValue}>${formatCurrency(data.totals.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer terms */}
                <View style={{marginTop: 20}}>
                    {data.notes ? (
                        <View style={{marginBottom: 10}}>
                            <Text style={styles.sectionTitle}>Notas:</Text>
                            <Text style={{fontSize: 9, color: '#4B5563'}}>{data.notes}</Text>
                        </View>
                    ) : null}
                    
                    <View style={{marginBottom: 10}}>
                         <Text style={styles.sectionTitle}>Términos de Pago:</Text>
                         <Text style={{fontSize: 9, color: '#4B5563'}}>{data.terms}</Text>
                    </View>
                </View>

                {/* Footer Legal */}
                <View style={styles.footer}>
                    <Text style={styles.disclaimer}>Este documento es una cotización y no constituye factura fiscal.</Text>
                    <Text style={styles.disclaimer}>Generado por ERP Panamá</Text>
                </View>
            </Page>
        </Document>
    );
};
