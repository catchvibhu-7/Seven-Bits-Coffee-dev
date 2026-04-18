export const KitchenSystem = {
    orders: [],

    pushOrder(cartItems, orderMethod) {
        const orderId = `SB-${Math.floor(Math.random() * 9000) + 1000}`;
        const newOrder = {
            id: orderId,
            timestamp: new Date().toLocaleTimeString(),
            method: orderMethod,
            // Every item now has its own 'completed' status
            items: cartItems.map(item => ({
                ...item,
                station: this.getStation(item),
                isDone: false 
            }))
        };
        this.orders.push(newOrder);
        return orderId;
    },

    getStation(item) {
        const baristaSections = ['fast-sellers', 'limited', 'classics', 'sweets'];
        return baristaSections.includes(item.section) ? 'BARISTA' : 'KITCHEN';
    }
};

window.printKOT = (order) => {
    const kotWindow = window.open('', 'PRINT', 'height=600,width=300');
    
    kotWindow.document.write(`
        <html>
            <body style="font-family:'Courier',monospace; width:80mm; padding:5mm; font-size:12pt;">
                <center>*** SEVEN BITS ***</center>
                <center>KITCHEN ORDER: ${order.id}</center>
                <hr>
                ${order.items.map(i => `
                    <div style="display:flex; justify-content:space-between;">
                        <span>${i.quantity} x ${i.name}</span>
                    </div>
                `).join('')}
                <hr>
                <small>TIME: ${order.timestamp}</small><br>
                <small>MODE: ${order.method}</small>
            </body>
        </html>
    `);
    kotWindow.document.close();
    kotWindow.print();
};