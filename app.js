import { menuData } from './brand-data.js';
import { CartSystem } from './cart-logic.js';
import { renderCheckoutModal } from './checkout-modal.js';
import { KitchenSystem } from './kitchen-logic.js';
import { AdminConfig } from './config-logic.js';

// --- System State ---
let cart = [];
let serviceChargeActive = true;
let tipApplied = false;
let currentKitchenStation = 'BARISTA';

// --- Page Navigation Logic ---
window.showPage = (pageId) => {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    // Show target page
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) targetPage.style.display = 'block';

    // Contextual Boots
    if (pageId === 'menu') renderMenu();
    if (pageId === 'kitchen') renderKitchen();
    if (pageId === 'admin') window.AdminPortal.init();
};

// --- Render Engine (Menu) ---
function renderMenu() {
    const root = document.getElementById('menu-root');
    if (!root) return;
    root.innerHTML = '';

    menuData.sections.forEach(section => {
        const sectionEl = document.createElement('section');
        sectionEl.className = `section-container section-${section.id}`;
        sectionEl.innerHTML = `<h2 class="section-title">${section.title}</h2>`;

        const items = menuData.items.filter(item => item.section === section.id);
        
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item';
            itemEl.innerHTML = `
                <div class="icon icon-${item.icon}"></div>
                <div class="info">
                    <div class="name">${item.name}</div>
                    <div class="story">${item.story}</div>
                </div>
                <div class="price">₹${item.price}</div>
                <button class="btn-order" onclick="addToCart(${item.id})">ADD BIT</button>
            `;
            sectionEl.appendChild(itemEl);
        });
        root.appendChild(sectionEl);
    });
}

// --- Cart & Checkout Functionality (Preserved & Enhanced) ---

window.addToCart = (id) => {
    const item = menuData.items.find(i => i.id === id);
    if (item) {
        cart.push({...item});
        document.getElementById('cart-count').innerText = cart.length;
        console.log(`System Update: [${item.name}] added to buffer.`);
    }
};

window.toggleTip = (isChecked) => {
    tipApplied = isChecked;
    refreshModal();
};

document.getElementById('cart-status').addEventListener('click', () => {
    if (cart.length > 0) refreshModal();
    else alert("Buffer Empty: No bits selected for checkout.");
});

function refreshModal() {
    const existingModal = document.getElementById('modal-overlay');
    if (existingModal) existingModal.remove();
    renderCheckoutModal(cart, serviceChargeActive, tipApplied);
}

window.closeModal = () => {
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.remove();
};

window.removeServiceCharge = () => {
    serviceChargeActive = false;
    refreshModal();
};

// --- Payment & KOT Generation ---

window.processPayment = (method) => {
    const config = AdminConfig.loadSettings();
    const finalData = CartSystem.calculateBreakdown(cart, serviceChargeActive);
    
    // Add Tip to total if applied
    let totalWithTip = finalData.total + (tipApplied ? config.tipAmount : 0);

    // Generate Kitchen Order Ticket (KOT)
    const orderId = KitchenSystem.pushOrder(cart, method);
    
    alert(`
        TRANSACTION INITIALIZED: #${orderId}
        -----------------------
        Method: ${method}
        Total Bits: ₹${totalWithTip.toFixed(2)}
        
        Status: KOT pushed to ${method === 'COUNTER' ? 'Barista' : 'Gateway'}.
    `);
    
    // Reset System State
    cart = [];
    serviceChargeActive = true;
    tipApplied = false;
    document.getElementById('cart-count').innerText = "0";
    window.closeModal();
};

// --- Kitchen Station Logic ---

window.filterKitchen = (station) => {
    currentKitchenStation = station;
    renderKitchen();
};

function renderKitchen() {
    const root = document.getElementById('kitchen-orders-root');
    if (!root) return;
    root.innerHTML = '';

    const pendingOrders = KitchenSystem.orders.filter(o => o.status === 'PENDING');

    pendingOrders.forEach(order => {
        // Only show items for the currently selected kitchen tab (BARISTA vs KITCHEN)
        const stationItems = order.items.filter(i => i.station === currentKitchenStation);
        if (stationItems.length === 0) return;

        const ticket = document.createElement('div');
        ticket.className = 'kot-ticket';
        ticket.innerHTML = `
            <div class="kot-header">
                <span class="order-id">#${order.id}</span>
                <span class="order-time">${order.timestamp}</span>
            </div>
            <div class="kot-body">
                ${stationItems.map(i => `<div class="kot-item">[ ] ${i.name}</div>`).join('')}
            </div>
            <div class="kot-footer">Type: ${order.method}</div>
            <button class="btn-complete" onclick="markCompleted('${order.id}')">DONE</button>
        `;
        root.appendChild(ticket);
    });
}

window.markCompleted = (orderId) => {
    const order = KitchenSystem.orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'COMPLETED';
        // Add the Ginger Animation trigger here
        triggerGingerAnimation();
        renderKitchen();
    }
};

function triggerGingerAnimation() {
    console.log("Ginger Cat walking across the screen...");
    // Future: Add a sprite-based animation here
}

// --- Initial Boot ---
showPage('home');