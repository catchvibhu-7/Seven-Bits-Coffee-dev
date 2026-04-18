import { menuData } from './brand-data.js';
import { AdminConfig } from './config-logic.js';

export const AdminPortal = {
    init() {
        this.renderAdminMenu();
        this.loadToggles();
    },

    loadToggles() {
        const config = AdminConfig.loadSettings();
        document.getElementById('tip-toggle').checked = config.tipEnabled;
    },

    // Save the global Ginger Tip status
    updateGlobalConfig() {
        const isEnabled = document.getElementById('tip-toggle').checked;
        AdminConfig.saveSettings({ tipEnabled: isEnabled });
        alert(`System Update: Ginger Tip is now ${isEnabled ? 'ACTIVE' : 'DISABLED'}`);
    },

    renderAdminMenu() {
        const container = document.getElementById('admin-menu-list');
        container.innerHTML = menuData.items.map(item => `
            <div class="admin-item-card" style="background:#222; margin-bottom:5px; padding:10px; display:flex; justify-content:space-between;">
                <span>[${item.id}] ${item.name} - ₹${item.price}</span>
                <div>
                    <button onclick="AdminPortal.deleteItem(${item.id})">DELETE</button>
                </div>
            </div>
        `).join('');
    },

    addItem(name, price, section, icon, story) {
        const newId = menuData.items.length > 0 ? Math.max(...menuData.items.map(i => i.id)) + 1 : 1;
        const newItem = { id: newId, section, name, price: parseFloat(price), icon, story };
        
        menuData.items.push(newItem);
        // In a real app, you'd push this to a DB. For now, we update the local memory.
        this.renderAdminMenu();
        alert(`Bit ${newId} synchronized to menu.`);
    },

    deleteItem(id) {
        const index = menuData.items.findIndex(i => i.id === id);
        if (index > -1) {
            menuData.items.splice(index, 1);
            this.renderAdminMenu();
        }
    }
};

// Globalize for the Admin UI
window.AdminPortal = AdminPortal;