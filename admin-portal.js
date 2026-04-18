import { menuData } from './brand-data.js';
import { AdminConfig } from './config-logic.js';
import { KitchenSystem } from './kitchen-logic.js';

export const AdminPortal = {
    init() {
        this.renderAdminMenu();
        this.loadSettings();
        this.renderAnalytics();
    },

    loadSettings() {
        const config = AdminConfig.loadSettings();
        document.getElementById('tip-toggle').checked = config.tipEnabled;
        document.getElementById('shop-name-input').value = config.shopName;
    },

    // --- Analytics Logic ---
    renderAnalytics() {
        const salesRoot = document.getElementById('admin-sales-root');
        if (!salesRoot) return;

        // In a real build, you'd pull this from a 'transactions' array
        const totalOrders = KitchenSystem.orders.length;
        const totalRevenue = KitchenSystem.orders.reduce((acc, order) => {
            return acc + order.items.reduce((sum, item) => sum + item.price, 0);
        }, 0);

        salesRoot.innerHTML = `
            <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="stat-card" style="border: 1px solid #d97706; padding: 10px;">
                    <div style="font-size: 8pt; color: #888;">TOTAL_ORDERS</div>
                    <div style="font-size: 18pt; color: #d97706;">${totalOrders}</div>
                </div>
                <div class="stat-card" style="border: 1px solid #d97706; padding: 10px;">
                    <div style="font-size: 8pt; color: #888;">REVENUE_BITS</div>
                    <div style="font-size: 18pt; color: #d97706;">₹${totalRevenue.toFixed(2)}</div>
                </div>
            </div>
        `;
    },

    // --- Menu Management ---
    renderAdminMenu() {
        const container = document.getElementById('admin-menu-list');
        if (!container) return;

        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <button onclick="AdminPortal.showAddItemForm()" class="btn-primary">+ ADD NEW BIT</button>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                <thead style="color: #d97706;">
                    <tr>
                        <th align="left">ID</th>
                        <th align="left">NAME</th>
                        <th align="left">PRICE</th>
                        <th align="right">ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    ${menuData.items.map(item => `
                        <tr style="border-bottom: 1px solid #222;">
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>₹${item.price}</td>
                            <td align="right">
                                <button onclick="AdminPortal.editPrice(${item.id})">EDIT</button>
                                <button onclick="AdminPortal.deleteItem(${item.id})" style="color: red;">X</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    editPrice(id) {
        const item = menuData.items.find(i => i.id === id);
        const newPrice = prompt(`Enter new price for ${item.name}:`, item.price);
        if (newPrice && !isNaN(newPrice)) {
            item.price = parseFloat(newPrice);
            this.renderAdminMenu();
            console.log(`System Update: Item ${id} price modified to ₹${newPrice}`);
        }
    },

    deleteItem(id) {
        if (confirm(`Confirm permanent deletion of Bit ${id}?`)) {
            const idx = menuData.items.findIndex(i => i.id === id);
            menuData.items.splice(idx, 1);
            this.renderAdminMenu();
        }
    }
};

window.AdminPortal = AdminPortal;