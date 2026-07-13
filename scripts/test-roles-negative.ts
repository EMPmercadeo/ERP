import { createPurchase, deletePurchase, anularPurchase } from '../src/lib/actions/purchases';
import { createSupplier, updateSupplier, toggleSupplierStatus, deleteSupplier, getSuppliersWithSummary } from '../src/lib/actions/suppliers';
import { createBodega, updateBodega, deleteBodega } from '../src/lib/actions/bodegas';
import { createTransferencia, recibirTransferencia, cancelarTransferencia } from '../src/lib/actions/transferencias';
import { createBankAccount, updateBankAccount, toggleBankAccountStatus, deleteBankAccount, importMovimientosBancarios, reconciliarMovimiento } from '../src/lib/actions/bank-accounts';

async function testRoles() {
    console.log('🚀 Iniciando pruebas de control de acceso vertical (negativas)...');
    let passedCount = 0;
    let failedCount = 0;

    function assertRejected(res: any, actionName: string) {
        const errorMsg = res?.message || res?.error || '';
        const isRejected = errorMsg.includes('Acceso denegado') || errorMsg.includes('Permisos insuficientes');
        if (isRejected) {
            console.log(`💚 PASS: ${actionName} rechazada correctamente.`);
            passedCount++;
        } else {
            console.error(`❌ FAIL: ${actionName} no fue rechazada como se esperaba. Respuesta:`, res);
            failedCount++;
        }
    }

    // --- ESCENARIO 1: ROL VENDEDOR ---
    console.log('\n--- Escenario 1: Evaluando usuario con rol "vendedor" ---');
    (global as any).__mockTenantContext = {
        empresaId: 'cmriqlyjy0000qgzwlk72lhqa',
        userId: 'test-vendedor',
        role: 'vendedor',
        emailVerified: true
    };

    // 1. Compras (Restringido a admin, gerente)
    const mockFormData = new FormData();
    assertRejected(await createPurchase({}, mockFormData), 'createPurchase (vendedor)');
    assertRejected(await deletePurchase('some-id'), 'deletePurchase (vendedor)');
    assertRejected(await anularPurchase('some-id'), 'anularPurchase (vendedor)');

    // 2. Proveedores (Restringido a admin, gerente)
    assertRejected(await createSupplier({}, mockFormData), 'createSupplier (vendedor)');
    assertRejected(await updateSupplier('some-id', {}, mockFormData), 'updateSupplier (vendedor)');
    assertRejected(await toggleSupplierStatus('some-id', 'inactivo'), 'toggleSupplierStatus (vendedor)');
    assertRejected(await deleteSupplier('some-id'), 'deleteSupplier (vendedor)');
    assertRejected(await getSuppliersWithSummary(), 'getSuppliersWithSummary (vendedor)');

    // 3. Bodegas (Restringido a admin, gerente)
    assertRejected(await createBodega({}, mockFormData), 'createBodega (vendedor)');
    assertRejected(await updateBodega('some-id', {}, mockFormData), 'updateBodega (vendedor)');
    assertRejected(await deleteBodega('some-id'), 'deleteBodega (vendedor)');

    // 4. Transferencias (Restringido a admin, gerente)
    assertRejected(await createTransferencia({}, mockFormData), 'createTransferencia (vendedor)');
    assertRejected(await recibirTransferencia('some-id'), 'recibirTransferencia (vendedor)');
    assertRejected(await cancelarTransferencia('some-id'), 'cancelarTransferencia (vendedor)');

    // 5. Bancos (Restringido a admin, gerente, contador)
    assertRejected(await createBankAccount({}, mockFormData), 'createBankAccount (vendedor)');
    assertRejected(await updateBankAccount('some-id', {
        nombre: 'Test', banco: 'Test', numeroCuenta: '123', tipoCuenta: 'Ahorro', cuentaContableId: 'cc', saldoInicial: 0
    }), 'updateBankAccount (vendedor)');
    assertRejected(await toggleBankAccountStatus('some-id', false), 'toggleBankAccountStatus (vendedor)');
    assertRejected(await deleteBankAccount('some-id'), 'deleteBankAccount (vendedor)');
    assertRejected(await importMovimientosBancarios('some-id', []), 'importMovimientosBancarios (vendedor)');
    assertRejected(await reconciliarMovimiento('some-id', 'mov-id', 'asiento-id'), 'reconciliarMovimiento (vendedor)');

    // --- ESCENARIO 2: ROL CONTADOR ---
    console.log('\n--- Escenario 2: Evaluando usuario con rol "contador" ---');
    (global as any).__mockTenantContext = {
        empresaId: 'cmriqlyjy0000qgzwlk72lhqa',
        userId: 'test-contador',
        role: 'contador',
        emailVerified: true
    };

    // 1. Compras (Restringido a admin, gerente) - Contador no puede
    assertRejected(await createPurchase({}, mockFormData), 'createPurchase (contador)');
    assertRejected(await deletePurchase('some-id'), 'deletePurchase (contador)');

    // 2. Bancos (Permitido para contador) - No debe dar error de rol
    const resBank = await updateBankAccount('non-existent-id-triggering-db-not-found', {
        nombre: 'Test', banco: 'Test', numeroCuenta: '123', tipoCuenta: 'Ahorro', cuentaContableId: 'cc', saldoInicial: 0
    });
    const errorMsgBank = resBank?.message || resBank?.error || '';
    const hasRoleError = errorMsgBank.includes('Acceso denegado') || errorMsgBank.includes('Permisos insuficientes');
    if (!hasRoleError) {
        console.log('💚 PASS: updateBankAccount (contador) no fue rechazada por rol (sino por otros errores de validación/datos).');
        passedCount++;
    } else {
        console.error('❌ FAIL: updateBankAccount (contador) fue rechazada por rol incorrectamente.');
        failedCount++;
    }

    console.log(`\n🎉 Resumen de Pruebas de Roles: ${passedCount} PASSED, ${failedCount} FAILED.`);
    if (failedCount > 0) {
        process.exit(1);
    }
}

testRoles().catch(e => {
    console.error('Fatal test error:', e);
    process.exit(1);
});
