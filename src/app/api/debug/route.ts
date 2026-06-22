import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint - Phase 2: Test exact queries from billing/settings pages.
 * DELETE THIS ROUTE after debugging is complete.
 */
export async function GET() {
    const empresaId = 'cmqmxpac10000qg2oes0084qj';
    const diagnostics: Record<string, any> = {
        timestamp: new Date().toISOString(),
    };

    // Test 1: findUnique with ALL fields (what settings page does)
    try {
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId }
        });
        diagnostics.findUniqueFull = 'OK';
        diagnostics.empresaFields = empresa ? Object.keys(empresa) : 'NULL';
        diagnostics.hasWhatsapp = empresa ? ('whatsappPhone' in empresa) : false;
        diagnostics.hasWebhook = empresa ? ('webhookUrl' in empresa) : false;
    } catch (err: any) {
        diagnostics.findUniqueFull = 'FAILED';
        diagnostics.findUniqueError = err?.message?.substring(0, 500);
    }

    // Test 2: findUnique with only billing fields
    try {
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId },
            select: {
                id: true,
                razonSocial: true,
                planType: true,
                subscriptionStatus: true,
            }
        });
        diagnostics.findUniqueSelect = 'OK';
        diagnostics.billingData = empresa;
    } catch (err: any) {
        diagnostics.findUniqueSelect = 'FAILED';
        diagnostics.findUniqueSelectError = err?.message?.substring(0, 500);
    }

    // Test 3: factura count (what both pages do)
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const count = await prisma.factura.count({
            where: {
                empresaId,
                fechaEmision: {
                    gte: startOfMonth
                }
            }
        });
        diagnostics.facturaCount = 'OK';
        diagnostics.invoicesThisMonth = count;
    } catch (err: any) {
        diagnostics.facturaCount = 'FAILED';
        diagnostics.facturaCountError = err?.message?.substring(0, 500);
    }

    // Test 4: toISOString on dates (settings page serialization)
    try {
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId },
            select: { createdAt: true, updatedAt: true }
        });
        if (empresa) {
            diagnostics.dateSerialize = 'OK';
            diagnostics.createdAt = empresa.createdAt.toISOString();
            diagnostics.updatedAt = empresa.updatedAt.toISOString();
        }
    } catch (err: any) {
        diagnostics.dateSerialize = 'FAILED';
        diagnostics.dateSerializeError = err?.message?.substring(0, 500);
    }

    return NextResponse.json(diagnostics, { status: 200 });
}
