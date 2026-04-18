export const CartSystem = {
    cgst_rate: 0.095, // 9.5%
    sgst_rate: 0.095, // 9.5%
    service_charge_rate: 0.02, // 2%
    
    calculateBreakdown(items) {
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
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