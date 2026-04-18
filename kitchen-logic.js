export const KitchenSystem = {
    orders: [],

    // Logic to categorize items
    getStation(item) {
        const baristaSections = ['fast-sellers', 'limited', 'classics', 'sweets'];
        return baristaSections.includes(item.section) ? 'BARISTA' : 'KITCHEN';
    },

    pushOrder(cartItems, orderMethod) {
        const orderId = `SB-${Math.floor(Math.random() * 9000) + 1000}`;
        const newOrder = {
            id: orderId,
            timestamp: new Date().toLocaleTimeString(),
            method: orderMethod,
            items: cartItems.map(item => ({
                ...item,
                station: this.getStation(item)
            })),
            status: 'PENDING'
        };
        this.orders.push(newOrder);
        return orderId;
    }
};