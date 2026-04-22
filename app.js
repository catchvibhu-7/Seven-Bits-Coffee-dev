import { menuData } from "./brand-data.js";
import { CartSystem } from "./cart-logic.js";
import { renderCheckoutModal } from "./checkout-modal.js";
import { KitchenSystem } from "./kitchen-logic.js";
import { AdminConfig } from "./config-logic.js";
import { SecuritySystem } from "./auth-logic.js";

// --- System State ---
let cart = [];
let serviceChargeActive = true;
let tipApplied = false;
let currentKitchenStation = "BARISTA";

// --- Page Navigation Logic ---
window.showPage = (pageId) => {
    // 1. Hide all pages
    document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));

    // 2. Show target page
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) targetPage.style.display = "block";

    // 3. Highlight the correct Nav Tab
    document.querySelectorAll(".system-nav button").forEach((btn) => {
        // Remove the highlight from all buttons
        btn.classList.remove("active-tab");

        // Find the button that matches the current pageId and highlight it
        // We check if the 'onclick' attribute contains the pageId string
        if (btn.getAttribute("onclick").includes(`'${pageId}'`)) {
            btn.classList.add("active-tab");
        }
    });

    // 4. Trigger specific page logic
    if (pageId === "admin") {
        import("./admin-portal.js").then((module) => {
            module.AdminPortal.init();
        });
    }
    if (pageId === "menu") renderMenu();
    if (pageId === "kitchen") renderKitchen();
};

// Initial boot: Highlight 'home' on load
showPage("home");

// --- Render Engine (Menu) ---
function renderMenu() {
    const root = document.getElementById("menu-root");
    if (!root) return;
    root.innerHTML = "";

    menuData.sections.forEach((section) => {
        const sectionEl = document.createElement("section");
        sectionEl.className = `section-container section-${section.id}`;
        sectionEl.innerHTML = `<h2 class="section-title">${section.title}</h2>`;

        const items = menuData.items.filter((item) => item.section === section.id);

        items.forEach((item) => {
            // Check if item is already in cart to show count on initial render
            const inCart = cart.find((c) => c.id === item.id);
            const count = inCart ? inCart.quantity : 0;
            const buttonText = count > 0 ? `ADD BIT +${count}` : `ADD BIT`;

            const itemEl = document.createElement("div");
            itemEl.className = "menu-item";
            itemEl.innerHTML = `
                                <div class="icon icon-${item.icon}"></div>
                                <div class="info">
                                    <div class="name">${item.name}</div>
                                    <div class="story">${item.story}</div>
                                </div>
                                <div class="price">₹${item.price}</div>
                                <button 
                                    id="btn-item-${item.id}" 
                                    class="btn-order ${count > 0 ? "active-count" : ""}" 
                                    onclick="addToCart(${item.id})">
                                    ${buttonText}
                                </button>
                            `;

            sectionEl.appendChild(itemEl);
        });
        root.appendChild(sectionEl);
    });
}

// --- Cart & Checkout Functionality (Preserved & Enhanced) ---

// --- Improved Add to Cart (Multi-Item) ---
window.addToCart = (id) => {
    const existingItem = cart.find((item) => item.id === id);
    let newCount = 1;

    if (existingItem) {
        existingItem.quantity += 1;
        newCount = existingItem.quantity;
    } else {
        const item = menuData.items.find((i) => i.id === id);
        if (item) {
            cart.push({ ...item, quantity: 1 });
        }
    }

    // UPDATE BUTTON UI
    const targetBtn = document.getElementById(`btn-item-${id}`);
    if (targetBtn) {
        // Keeps the text short to prevent button expansion
        targetBtn.innerText = `ADD BIT +${newCount}`;
        targetBtn.classList.add("active-count");
    }

    updateCartUI();
};
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").innerText = totalItems;
}

// --- Secured Navigation ---
const originalShowPage = window.showPage;
window.showPage = (pageId) => {
    if (pageId === "admin") {
        if (!SecuritySystem.checkAccess()) {
            if (!SecuritySystem.requestLogin()) return; // Stop if login fails
        }
    }
    originalShowPage(pageId);
};

window.toggleTip = (isChecked) => {
    tipApplied = isChecked;
    refreshModal();
};

document.getElementById("cart-status").addEventListener("click", () => {
    if (cart.length > 0) refreshModal();
    else alert("Buffer Empty: No bits selected for checkout.");
});

function refreshModal() {
    const existingModal = document.getElementById("modal-overlay");
    if (existingModal) existingModal.remove();
    renderCheckoutModal(cart, serviceChargeActive, tipApplied);
}

window.closeModal = () => {
    const modal = document.getElementById("modal-overlay");
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
        
        Status: KOT pushed to ${method === "COUNTER" ? "Barista" : "Gateway"}.
    `);

    // Reset System State
    cart = [];
    renderMenu(); // This clears the "BITS ADDED" text on all buttons
    updateCartUI();
    serviceChargeActive = true;
    tipApplied = false;
    document.getElementById("cart-count").innerText = "0";
    window.closeModal();
};

// --- Kitchen Station Logic ---

window.filterKitchen = (station) => {
    currentKitchenStation = station;

    // Highlight the selected kitchen tab
    document.querySelectorAll(".kitchen-tabs button").forEach((btn) => {
        btn.classList.remove("active-station");
        // Match based on the text or the station string passed
        if (btn.innerText.includes(station)) {
            btn.classList.add("active-station");
        }
    });

    renderKitchen();
};

function renderKitchen() {
    const root = document.getElementById("kitchen-orders-root");
    if (!root) return;
    root.innerHTML = "";

    // Sort orders: Latest (newest) on top
    const sortedOrders = [...KitchenSystem.orders].reverse();

    sortedOrders.forEach((order) => {
        let itemsToDisplay = [];
        let isMaster = currentKitchenStation === "MASTER";

        if (isMaster) {
            itemsToDisplay = order.items; // Show everything
        } else {
            // Filter for current station and only show if not done
            itemsToDisplay = order.items.filter((i) => i.station === currentKitchenStation && !i.isDone);
        }

        if (itemsToDisplay.length === 0) return;

        const ticket = document.createElement("div");
        // Add a class if the whole order is finished
        const isOrderComplete = order.items.every((i) => i.isDone);
        ticket.className = `kot-ticket ${isOrderComplete ? "order-archived" : ""}`;

        ticket.innerHTML = `
            <div class="kot-header">
                <span class="order-id">#${order.id}</span>
                <span class="order-time">${order.timestamp}</span>
            </div>
            <div class="kot-body">
                ${itemsToDisplay
                    .map((i) => {
                        // In Master view, show a checkbox for status
                        const statusIcon = i.isDone ? " [EXE]" : " [WAIT]";
                        const statusClass = i.isDone ? "item-done" : "item-pending";
                        return `
                        <div class="kot-item ${statusClass}" style="margin-bottom:4px;">
                            <span><strong>${i.quantity}x</strong> ${i.name}</span>
                            <span class="status-tag">${isMaster ? statusIcon : ""}</span>
                        </div>
                    `;
                    })
                    .join("")}
            </div>
            ${!isMaster ? `<button class="btn-complete" onclick="markCompleted('${order.id}')">MARK STATION DONE</button>` : ""}
            ${isMaster && isOrderComplete ? `<div class="complete-banner">COMPLETE</div>` : ""}
        `;
        root.appendChild(ticket);
    });
}

window.markCompleted = (orderId) => {
    const order = KitchenSystem.orders.find((o) => o.id === orderId);

    if (order) {
        // 1. Only mark items belonging to the current station as Done
        let stationItems = order.items.filter((i) => i.station === currentKitchenStation);

        stationItems.forEach((item) => (item.isDone = true));

        // 2. Check if the entire station's work for this order is finished
        const allStationItemsDone = stationItems.every((i) => i.isDone === true);

        if (allStationItemsDone) {
            // Trigger animation only when that station is actually clear
            if (window.triggerGingerAnimation) window.triggerGingerAnimation();

            console.log(`System Update: ${currentKitchenStation} items for ${orderId} cleared.`);
            renderKitchen();
        }

        const totalOrderDone = order.items.every((i) => i.isDone === true);
        if (totalOrderDone) {
            order.status = "ARCHIVED"; // Final state for the database
            console.log(`Order ${orderId} fully processed. Logging revenue...`);
        }
    }
};

function triggerGingerAnimation() {
    console.log("Ginger Cat walking across the screen...");
    // Future: Add a sprite-based animation here
}

// --- Initial Boot ---
showPage("home");

window.triggerGingerAnimation = () => {
    // Create the notification element
    const alert = document.createElement("div");
    alert.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: -200px;
        background: #d97706;
        color: black;
        padding: 10px 20px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        z-index: 10000;
        border: 2px solid black;
        box-shadow: 4px 4px 0px #000;
        transition: all 1.5s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    `;
    alert.innerText = "G-BIT: ORDER_READY >^..^<";
    document.body.appendChild(alert);

    // Slide in
    setTimeout(() => {
        alert.style.left = "20px";
    }, 100);

    // Slide out and remove
    setTimeout(() => {
        alert.style.left = "110%";
        setTimeout(() => alert.remove(), 1500);
    }, 3000);
};
// --- Dynamic Pricing Engine ---
function getCurrentPrice(item) {
    const hour = new Date().getHours();
    let price = item.basePrice;

    // Happy Hour: 2 PM (14) to 4 PM (16)
    if (hour >= 14 && hour < 16) {
        price = price * 0.9; // 10% Discount
    }
    return Math.round(price);
}

// --- Ginger's Cut & Loyalty Logic ---
window.applyDiscounts = (subtotal, phone) => {
    let discount = 0;
    let message = "";

    // Easter Egg: Ends in .77 or total is 1024
    if (subtotal.toString().endsWith("77") || subtotal === 1024) {
        discount = subtotal * 0.07;
        message = "GINGER'S CUT: 7% Easter Egg Discount Decrypted!";
    }

    // Loyalty: Check local storage for phone 'bits'
    const visits = localStorage.getItem(`loyalty_${phone}`) || 0;
    if (parseInt(visits) === 6) {
        // 7th visit
        message = "LOYALTY OVERFLOW: 7th Visit detected. Free Classic Item applied!";
        // Logic to zero out most expensive Classic item
    }

    return { discount, message };
};

// --- Inventory Deduction ---
window.deductInventory = (cart) => {
    cart.forEach((item) => {
        for (const [ing, amt] of Object.entries(item.ingredients || {})) {
            menuData.inventory[ing] -= amt;
            if (menuData.inventory[ing] < 500) {
                console.warn(`CRITICAL: Low Stock on ${ing}`);
            }
        }
    });
};