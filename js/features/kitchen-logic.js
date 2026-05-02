/**
 * SEVEN BITS COFFEE - KITCHEN SYSTEM logic
 * Location: /js/features/kitchen-logic.js
 */
export const KitchenSystem = {
    orders: [],

    pushOrder(cartItems, orderMethod) {
        const orderId = `SB-${Math.floor(Math.random() * 9000) + 1000}`;
        const newOrder = {
            id: orderId,
            timestamp: new Date().toLocaleTimeString(),
            method: orderMethod,
            isPaid: (orderMethod === 'ONLINE'), 
            items: cartItems.map(item => ({
                ...item,
                station: this.getStation(item),
                isDone: false 
            }))
        };
        this.orders.push(newOrder);
        return orderId;
    },

    /**
     * Corrected Station Mapping:
     * BARISTA: Drinks and Sweets (Fast Sellers, Classics, Sweets, Limited)
     * KITCHEN: Hardware / Savory (Savory Hardware)
     */
    getStation(item) {
        const baristaSections = ['fast-sellers', 'limited', 'classics', 'sweets'];
        return baristaSections.includes(item.section) ? 'BARISTA' : 'KITCHEN';
    }
};

window.printKOT = (order) => {
    const kotWindow = window.open('', 'PRINT', 'height=600,width=300');
    kotWindow.document.write(`
        <html>
            <body style="font-family:'Courier',monospace; width:80mm; padding:5mm; font-size:12pt; color:black;">
                <center>
                    <h2 style="margin:0;">*** SEVEN BITS ***</h2>
                    <div>KITCHEN ORDER: ${order.id}</div>
                    <div style="font-size: 10pt;">${order.method}</div>
                </center>
                <hr style="border:0; border-top:1px dashed #000; margin: 10px 0;">
                <table style="width:100%;">
                    ${order.items.map(i => `<tr><td style="padding:3px 0;"><strong>${i.quantity}x</strong> ${i.name}</td></tr>`).join('')}
                </table>
                <hr style="border:0; border-top:1px dashed #000; margin: 10px 0;">
                <small>TIME: ${order.timestamp}</small>
                <div style="text-align:center; margin-top:15px; font-size: 9pt;">--- ORDER_BITS_PUSHED ---</div>
            </body>
        </html>
    `);
    kotWindow.document.close();
    kotWindow.print();
};