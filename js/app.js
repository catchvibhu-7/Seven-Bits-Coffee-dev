/**
 * SEVEN BITS COFFEE - MAIN APPLICATION LOGIC
 * Location: /js/app.js
 */
import { menuData } from "./core/brand-data.js";
import { CartSystem } from "./features/cart-logic.js";
import { KitchenSystem } from "./features/kitchen-logic.js";
import { AdminConfig } from "./features/config-logic.js";
import { SecuritySystem } from "./features/auth-logic.js";
import { renderCheckoutModal } from "./ui/checkout-modal.js";

// --- System State ---
let cart = [];
let serviceChargeActive = true;
let tipApplied = false;
let currentKitchenStation = "BARISTA";
let viewMode = "list"; 

/**
 * NAVIGATION & VIEW CONTROL
 */
window.setViewMode = (mode) => {
    viewMode = mode;
    renderMenu();
};

window.showPage = (pageId) => {
    if (pageId === "admin") {
        if (!SecuritySystem.checkAccess()) {
            if (!SecuritySystem.requestLogin()) return;
        }
    }
    
    document.querySelectorAll(".page").forEach((p) => {
        p.style.display = "none";
        p.classList.remove("active");
    });
    
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.style.display = "block";
        targetPage.classList.add("active");
    }

    document.querySelectorAll(".system-nav button").forEach((btn) => {
        btn.classList.remove("active-tab");
        if (btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(`'${pageId}'`)) {
            btn.classList.add("active-tab");
        }
    });

    if (pageId === "admin") {
        import("./ui/admin-portal.js").then((module) => { module.AdminPortal.init(); });
    }
    if (pageId === "menu") renderMenu();
    if (pageId === "kitchen") renderKitchen();
};

/**
 * CART LOGIC
 */
window.addToCart = (id) => {
    const item = cart.find(i => i.id === id);
    if (item) { item.quantity++; } 
    else {
        const product = menuData.items.find(i => i.id === id);
        if (product) cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
    renderMenu();
};

window.removeFromCart = (id) => {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity--;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
    renderMenu();
};

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const counter = document.getElementById("cart-count");
    if (counter) counter.innerText = totalItems;
}

/**
 * PRINTING SYSTEM (BILL & KOT)
 */
window.printBill = (order) => {
    const config = AdminConfig.loadSettings();
    const breakdown = CartSystem.calculateBreakdown(order.items);
    
    let finalTotal = breakdown.total;
    if (!serviceChargeActive) finalTotal -= breakdown.serviceCharge;
    if (config.tipEnabled && tipApplied) finalTotal += config.tipAmount;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', monospace; width: 80mm; padding: 10px; color: #000; }
                .center { text-align: center; }
                .hr { border-bottom: 1px dashed #000; margin: 10px 0; }
                .row { display: flex; justify-content: space-between; font-size: 9pt; margin: 3px 0; }
                .total { font-weight: bold; font-size: 12pt; border-top: 1px solid #000; padding-top: 5px; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            <div class="center">
                <h3>SEVEN BITS COFFEE</h3>
                <p style="font-size: 8pt;">Hazaribagh, Jharkhand<br>#${order.id} | ${new Date().toLocaleString()}</p>
            </div>
            <div class="hr"></div>
            ${order.items.map(item => `
                <div class="row">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="hr"></div>
            <div class="row">SUBTOTAL: <span>₹${breakdown.subtotal.toFixed(2)}</span></div>
            <div class="row">TAX (GST 18%): <span>₹${(breakdown.cgst + breakdown.sgst).toFixed(2)}</span></div>
            ${serviceChargeActive ? `<div class="row">SVC CHG: <span>₹${breakdown.serviceCharge.toFixed(2)}</span></div>` : ''}
            ${tipApplied ? `<div class="row">GINGER TIP: <span>₹${config.tipAmount.toFixed(2)}</span></div>` : ''}
            <div class="row total">TOTAL: <span>₹${finalTotal.toFixed(2)}</span></div>
            <div class="hr"></div>
            <p class="center" style="font-size: 8pt;">- G=7 | Processed with precision -</p>
        </body>
        </html>
    `);
    printWindow.document.close();
};

window.printKOT = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', monospace; width: 80mm; padding: 10px; }
                .header { border-bottom: 2px solid #000; padding-bottom: 5px; text-align: center; }
                .item { font-size: 14pt; font-weight: bold; margin: 10px 0; border-bottom: 1px dashed #ccc; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            <div class="header">
                <h2>KITCHEN TICKET</h2>
                <p>#${order.id} | TYPE: ${order.paymentMethod}</p>
            </div>
            ${order.items.map(item => `
                <div class="item">${item.quantity}x ${item.name}</div>
            `).join('')}
            <div style="margin-top: 20px; text-align: center; font-size: 8pt;">${new Date().toLocaleTimeString()}</div>
        </body>
        </html>
    `);
    printWindow.document.close();
};

/**
 * TRANSACTION FLOW
 */
window.printAndProcess = (method) => {
    const orderId = KitchenSystem.pushOrder(cart, method);
    const order = KitchenSystem.orders.find(o => o.id === orderId);

    // Sequence the prints
    window.printBill(order);
    window.printKOT(order);

    window.finalizeOrder();
};

/**
 * DYNAMIC MENU ENGINE
 */
function renderMenu() {
    const root = document.getElementById("menu-root");
    if (!root) return;
    root.innerHTML = "";

    menuData.sections.forEach((section) => {
        const sectionEl = document.createElement("section");
        sectionEl.className = `section-container section-${section.id}`;
        
        const header = document.createElement("h2");
        header.className = "section-title";
        header.innerText = section.title;
        sectionEl.appendChild(header);

        const itemsContainer = document.createElement("div");
        itemsContainer.className = viewMode === "grid" ? "menu-grid" : "menu-list";

        const items = menuData.items.filter((item) => item.section === section.id);
        
        items.forEach((item) => {
            const inCart = cart.find((c) => c.id === item.id);
            const count = inCart ? inCart.quantity : 0;
            const iconClass = `icon-${item.icon}`;

            const buttonHTML = count > 0 
                ? `<div class="btn-order active-count" style="display: flex; width: 120px; height: 38px; align-items: center;">
                        <button onclick="window.removeFromCart(${item.id})" style="flex: 1; height: 100%; background: transparent; color: inherit; border: none; border-right: 1px solid currentColor; cursor: pointer;">-</button>
                        <span style="flex: 1.2; text-align: center; font-size: 10pt; font-weight: bold;">${count}</span>
                        <button onclick="window.addToCart(${item.id})" style="flex: 1; height: 100%; background: transparent; color: inherit; border: none; border-left: 1px solid currentColor; cursor: pointer;">+</button>
                   </div>`
                : `<button class="btn-order" style="width: 120px; height: 38px;" onclick="window.addToCart(${item.id})">ADD BIT</button>`;

            const itemEl = document.createElement("div");
            itemEl.className = "menu-item";
            itemEl.innerHTML = `
                <span class="icon ${iconClass}"></span>
                <div class="info">
                    <div class="name">${item.name}</div>
                    <div class="story" style="font-size: 8pt; color: #666;">${item.story}</div>
                </div>
                <div class="price">₹${item.price}</div>
                <div class="button-container">${buttonHTML}</div>
            `;
            itemsContainer.appendChild(itemEl);
        });

        if (viewMode === "grid") {
            const remainder = items.length % 3;
            if (remainder !== 0) {
                for (let i = 0; i < (3 - remainder); i++) {
                    const filler = document.createElement("div");
                    filler.className = "menu-item filler-bit";
                    filler.innerHTML = `<div class="filler-cat"></div>`;
                    itemsContainer.appendChild(filler);
                }
            }
        }
        sectionEl.appendChild(itemsContainer);
        root.appendChild(sectionEl);
    });
}

/**
 * KITCHEN MANAGEMENT
 */
window.filterKitchen = (station) => {
    currentKitchenStation = station;
    document.querySelectorAll(".kitchen-tabs button").forEach(btn => {
        btn.classList.remove("active-station");
        if (btn.innerText.includes(station)) btn.classList.add("active-station");
    });
    renderKitchen();
};

function renderKitchen() {
    const root = document.getElementById("kitchen-orders-root");
    if (!root) return;
    root.innerHTML = "";

    KitchenSystem.orders.slice().reverse().forEach((order) => {
        const isMaster = currentKitchenStation === "MASTER";
        const itemsToDisplay = isMaster ? order.items : order.items.filter(i => i.station === currentKitchenStation && !i.isDone);

        if (itemsToDisplay.length === 0) return;

        const ticket = document.createElement("div");
        ticket.className = "kot-ticket";
        const paidStatus = order.isPaid ? '✓ PAID' : `<button onclick="window.markPaid('${order.id}')" style="cursor:pointer; border:1px solid #000; background:none; font-size:7pt;">MARK PAID</button>`;

        ticket.innerHTML = `
            <div class="kot-header">
                <span>#${order.id}</span>
                <span style="float:right;">${paidStatus}</span>
            </div>
            <div class="kot-body">
                ${itemsToDisplay.map(i => `<div class="${i.isDone ? 'item-done' : 'item-pending'}"><strong>${i.quantity}x</strong> ${i.name}</div>`).join('')}
            </div>
            ${!isMaster ? `<button class="btn-primary" style="width:100%; margin-top:10px; font-size:9pt; background:#d97706; color:black; border:none; padding:8px; font-weight:bold; cursor:pointer;" onclick="window.markCompleted('${order.id}')">MARK DONE</button>` : ""}
        `;
        root.appendChild(ticket);
    });
}

window.markPaid = (orderId) => {
    const order = KitchenSystem.orders.find(o => o.id === orderId);
    if (order) { order.isPaid = true; renderKitchen(); }
};

window.markCompleted = (orderId) => {
    const order = KitchenSystem.orders.find((o) => o.id === orderId);
    if (order) {
        order.items.filter(i => i.station === currentKitchenStation).forEach(i => i.isDone = true);
        window.triggerGingerAnimation();
        renderKitchen();
    }
};

/**
 * UI HELPERS & MODALS
 */
window.processPayment = (method) => {
    const isOnline = method === 'ONLINE';
    const overlay = document.createElement("div");
    overlay.id = "payment-overlay";
    overlay.className = "modal-overlay";
    overlay.style.zIndex = "4000";
    
    overlay.innerHTML = `
        <div class="modal-content" style="text-align: center; border-color: ${isOnline ? '#22d3ee' : '#d97706'};">
            <h2 style="color: ${isOnline ? '#22d3ee' : '#d97706'}; font-size: 1.2rem;">${isOnline ? 'UPI_GATEWAY' : 'COUNTER_READY'}</h2>
            
            ${isOnline ? '<div style="background:white; padding:10px; margin:10px auto; width:150px;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=sevenbits@upi" alt="QR"></div>' : '<p style="margin:20px 0;">PAYMENT PENDING AT COUNTER.</p>'}
            
            <div style="display: grid; gap: 10px; margin-top: 20px;">
                <button class="btn-primary" style="background: #d97706; color: black; border:none; padding:12px; font-weight:bold; cursor:pointer;" onclick="window.printAndProcess('${method}')">PRINT BILL & SEND KOT</button>
                <button class="btn-close" style="background: #333; color: white;" onclick="document.getElementById('payment-overlay').remove()">CANCEL</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.finalizeOrder = () => {
    document.getElementById("payment-overlay")?.remove();
    cart = [];
    serviceChargeActive = true;
    tipApplied = false;
    updateCartUI();
    window.closeModal();
    renderMenu();
};

const cartStatus = document.getElementById("cart-status");
if (cartStatus) {
    cartStatus.addEventListener("click", () => {
        if (cart.length > 0) {
            renderCheckoutModal(cart, serviceChargeActive, tipApplied);
        } else {
            alert("SYSTEM_IDLE: Select bits.");
        }
    });
}

window.closeModal = () => document.getElementById("modal-overlay")?.remove();
window.toggleTip = (check) => { tipApplied = check; window.closeModal(); document.getElementById("cart-status").click(); };
window.removeServiceCharge = () => { serviceChargeActive = false; window.closeModal(); document.getElementById("cart-status").click(); };

window.triggerGingerAnimation = () => {
    const alertBox = document.createElement("div");
    alertBox.style.cssText = `position: fixed; bottom: 30px; left: -200px; background: #d97706; color: black; padding: 10px 20px; z-index: 10000; border: 2px solid black; transition: all 1.5s cubic-bezier(0.18, 0.89, 0.32, 1.28);`;
    alertBox.innerText = "G-BIT: READY";
    document.body.appendChild(alertBox);
    setTimeout(() => { alertBox.style.left = "20px"; }, 100);
    setTimeout(() => { alertBox.style.left = "110%"; setTimeout(() => alertBox.remove(), 1500); }, 3000);
};

window.showPage("home");