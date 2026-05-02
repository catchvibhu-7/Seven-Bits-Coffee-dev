/**
 * SEVEN BITS COFFEE - TAX ENGINE
 * Location: /js/features/cart-logic.js
 */
export const CartSystem = {
    cgst_rate: 0.095, 
    sgst_rate: 0.095, 
    service_charge_rate: 0.02, 
    
    calculateBreakdown(items) {
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cgst = subtotal * this.cgst_rate;
        const sgst = subtotal * this.sgst_rate;
        const serviceCharge = subtotal * this.service_charge_rate;
        
        return {
            subtotal,
            cgst,
            sgst,
            serviceCharge,
            total: subtotal + cgst + sgst + serviceCharge
        };
    }
};