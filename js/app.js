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
        import("./ui/admin-portal.js").then((module) => {
            module.AdminPortal.init();
        });
    }
    if (pageId === "menu") renderMenu();
    if (pageId === "kitchen" || pageId === "orders") {
        renderKitchen();
    }
};

/**
 * CART LOGIC
 */
window.addToCart = (id) => {
    const item = cart.find((i) => i.id === id);
    if (item) {
        item.quantity++;
    } else {
        const product = menuData.items.find((i) => i.id === id);
        if (product) cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
    renderMenu();
};

window.removeFromCart = (id) => {
    const item = cart.find((i) => i.id === id);
    if (item) {
        item.quantity--;
        if (item.quantity <= 0) cart = cart.filter((i) => i.id !== id);
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

    const printWindow = window.open("", "_blank");
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
            ${order.items
                .map(
                    (item) => `
                <div class="row">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `
                )
                .join("")}
            <div class="hr"></div>
            <div class="row">SUBTOTAL: <span>₹${breakdown.subtotal.toFixed(2)}</span></div>
            <div class="row">TAX (GST 18%): <span>₹${(breakdown.cgst + breakdown.sgst).toFixed(2)}</span></div>
            ${serviceChargeActive ? `<div class="row">SVC CHG: <span>₹${breakdown.serviceCharge.toFixed(2)}</span></div>` : ""}
            ${tipApplied ? `<div class="row">GINGER TIP: <span>₹${config.tipAmount.toFixed(2)}</span></div>` : ""}
            <div class="row total">TOTAL: <span>₹${finalTotal.toFixed(2)}</span></div>
            <div class="hr"></div>
            <p class="center" style="font-size: 8pt;">- G=7 | Processed with precision -</p>
        </body>
        </html>
    `);
    printWindow.document.close();
};

window.printKOT = (order) => {
    const printWindow = window.open("", "_blank");
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
            ${order.items
                .map(
                    (item) => `
                <div class="item">${item.quantity}x ${item.name}</div>
            `
                )
                .join("")}
            <div style="margin-top: 20px; text-align: center; font-size: 8pt;">${new Date().toLocaleTimeString()}</div>
        </body>
        </html>
    `);
    printWindow.document.close();
};

/**
 * TRANSACTION FLOW (REORDERED FOR IPAD BUG FIX)
 */
window.printAndProcess = (method) => {
    // 1. Create the permanent record first
    const orderId = KitchenSystem.pushOrder(cart, method);
    const order = KitchenSystem.orders.find((o) => o.id === orderId);

    // 2. IPAD FIX: Finalize the app state BEFORE triggering the print block
    const tempItems = [...cart]; // Local copy for printing
    cart = [];
    serviceChargeActive = true;
    tipApplied = false;
    updateCartUI();
    document.getElementById("payment-overlay")?.remove();
    window.closeModal();
    renderMenu();

    // 3. Trigger Prints (These act as blocking calls in some browsers)
    setTimeout(() => {
        window.printBill(order);
        window.printKOT(order);
    }, 300); // Tiny delay to ensure DOM updates complete
};

/**
 * DYNAMIC MENU ENGINE
 */
// --- Search Logic ---
window.initSearchBar = () => {
    const searchInput = document.getElementById("menu-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderMenu(e.target.value);
        });
    }
};

/**
 * DYNAMIC MENU ENGINE - SEVEN BITS STABLE BUILD
 */
window.setViewMode = (mode) => {
    viewMode = mode;
    renderMenu(document.getElementById("menu-search")?.value || "");
};

window.toggleJumpMenu = () => {
    // Prevent the click from immediately triggering the document listener
    if (event) event.stopPropagation();
    const menu = document.getElementById("jump-menu");
    if (!menu) return;

    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        // Build the list dynamically from menuData sections
        menu.innerHTML = `
            <div class="jump-header">Categories:</div>
            ${menuData.sections
                .map(
                    (s) => `
                <div class="jump-option" onclick="window.jumpTo('${s.id}')">
                    <span class="jump-id">${s.id.padStart(2, "0")}</span> ${s.title.toUpperCase()}
                </div>
            `
                )
                .join("")}
        `;
        menu.style.display = "block";
    }
};

window.jumpTo = (sectionId) => {
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("jump-menu").style.display = "none";
    }
};
function renderMenu(filterQuery = "") {
    const root = document.getElementById("menu-root");
    if (!root) return;
    root.innerHTML = "";

    menuData.sections.forEach((section) => {
        const items = menuData.items.filter((item) => 
            item.section === section.id && 
            item.name.toLowerCase().includes(filterQuery.toLowerCase())
        );

        if (items.length === 0) return;

        const sectionEl = document.createElement("section");
        sectionEl.id = `section-${section.id}`; 
        sectionEl.className = "section-container";
        sectionEl.innerHTML = `<h2 class="section-title">${section.title}</h2>`;

        const itemsContainer = document.createElement("div");
        itemsContainer.className = viewMode === "grid" ? "menu-grid" : "menu-list";

        items.forEach((item) => {
            const inCart = cart.find((c) => c.id === item.id);
            const count = inCart ? inCart.quantity : 0;

            const buttonHTML = count > 0 ? 
                `<div class="btn-qty-container">
                    <button onclick="window.removeFromCart(${item.id})">-</button>
                    <span>${count}</span>
                    <button onclick="window.addToCart(${item.id})">+</button>
                </div>` : 
                `<button class="btn-add-fixed" onclick="window.addToCart(${item.id})">ADD BIT</button>`;

            const itemEl = document.createElement("div");
            itemEl.className = "menu-item";
            itemEl.innerHTML = `
                <span class="icon icon-${item.icon}"></span>
                <div class="info">
                    <div class="name">${item.name}</div>
                    <div class="story">${item.story}</div>
                </div>
                <div class="item-controls">
                    <div class="price-fixed">₹${item.price}</div>
                    <div class="action-fixed">${buttonHTML}</div>
                </div>
            `;
            itemsContainer.appendChild(itemEl);
        });
        
        sectionEl.appendChild(itemsContainer);
        root.appendChild(sectionEl);
    });

    const footer = document.getElementById("footer-actions");
    const cartBar = document.getElementById("cart-status");
    
    if (footer) {
        // ALWAYS show the footer container so the Jump Button is accessible
        footer.style.display = "flex"; 
    }

    if (cartBar) {
        // ONLY hide the orange cart bar if the cart is empty
        cartBar.style.display = cart.length > 0 ? "flex" : "none";
    }
}

// Fixed Cart Click Logic
window.handleCartClick = () => {
    if (cart.length > 0) {
        renderCheckoutModal(cart, serviceChargeActive, tipApplied);
    }
};

/**
 * KITCHEN MANAGEMENT
 */
window.filterKitchen = (station) => {
    currentKitchenStation = station;

    document.querySelectorAll(".kitchen-tabs button").forEach((btn) => {
        // Remove active class from everyone
        btn.classList.remove("active-station");

        // Match based on the data-station attribute instead of text
        if (btn.getAttribute("data-station") === station) {
            btn.classList.add("active-station");
        }
    });

    renderKitchen();
};

function renderKitchen() {
    const root = document.getElementById("kitchen-orders-root");
    if (!root) return;
    root.innerHTML = "";

    KitchenSystem.orders
        .slice()
        .reverse()
        .forEach((order) => {
            const isMaster = currentKitchenStation === "MASTER";

            // IMPORTANT: We must use KitchenSystem.getStation(i)
            // if your items don't have the .station property directly.
            const itemsToDisplay = isMaster
                ? order.items
                : order.items.filter((i) => {
                      const station = i.station || KitchenSystem.getStation(i);
                      return station === currentKitchenStation && !i.isDone;
                  });

            if (!isMaster && itemsToDisplay.length === 0) return;

            const hasPendingItems = itemsToDisplay.some((i) => !i.isDone);

            const ticket = document.createElement("div");
            ticket.className = "kot-ticket";
            const paidStatus = order.isPaid
                ? "✓ PAID"
                : `<button onclick="window.markPaid('${order.id}')" style="cursor:pointer; border:1px solid #000; background:none; font-size:7pt;">MARK PAID</button>`;

            ticket.innerHTML = `
            <div class="kot-header">
                <span>#${order.id}</span>
                <span style="float:right;">${paidStatus}</span>
            </div>
            <div class="kot-body">
                ${itemsToDisplay
                    .map(
                        (i) => `
                    <div class="${i.isDone ? "item-done" : "item-pending"}">
                        <strong>${i.quantity}x</strong> ${i.name}
                        ${isMaster && i.isDone ? '<span style="font-size:7pt; opacity:0.5; margin-left:5px;">[OK]</span>' : ""}
                    </div>
                `
                    )
                    .join("")}
            </div>
            
            ${
                hasPendingItems
                    ? `
                <button class="btn-primary" 
                        style="width:100%; margin-top:10px; font-size:9pt; background:#d97706; color:black; border:none; padding:8px; font-weight:bold; cursor:pointer;" 
                        onclick="window.markCompleted('${order.id}')">
                    ${isMaster ? "MARK ALL DONE" : "MARK DONE"}
                </button>
            `
                    : ""
            }
        `;
            root.appendChild(ticket);
        });
}

window.markPaid = (orderId) => {
    const order = KitchenSystem.orders.find((o) => o.id === orderId);
    if (order) {
        order.isPaid = true;
        renderKitchen();
    }
};

window.markCompleted = (orderId) => {
    const order = KitchenSystem.orders.find((o) => o.id === orderId);

    if (order) {
        // 1. Mark items as done based on current view
        const targetItems =
            currentKitchenStation === "MASTER"
                ? order.items
                : order.items.filter((i) => i.station === currentKitchenStation);

        targetItems.forEach((i) => (i.isDone = true));

        // 2. Generate the specific Ginger notification
        let msg = `Order #${orderId}: `;
        const allDone = order.items.every((i) => i.isDone);

        if (allDone) {
            msg += "Ready";
        } else {
            const stationLabels = {
                DESSERTS: "Dessert ready",
                KITCHEN: "Food ready",
                BARISTA: "Drink ready"
            };
            msg += stationLabels[currentKitchenStation] || "Done";
        }

        // 3. Trigger the animation with the dynamic message
        window.triggerGingerAnimation(msg);

        // 4. CRITICAL: Re-run the render to hide the button
        renderKitchen();
    }
};

/**
 * UI HELPERS & MODALS
 */
window.processPayment = (method) => {
    const isOnline = method === "ONLINE";
    const overlay = document.createElement("div");
    overlay.id = "payment-overlay";
    overlay.className = "modal-overlay";
    overlay.style.zIndex = "4000";

    overlay.innerHTML = `
        <div class="modal-content" style="text-align: center; border-color: ${isOnline ? "#22d3ee" : "#d97706"}; background: black; padding: 30px; border: 2px solid;">
            <h2 style="color: ${isOnline ? "#22d3ee" : "#d97706"}; font-size: 1.2rem; font-family: 'Courier New', monospace;">${isOnline ? "UPI_GATEWAY" : "COUNTER_READY"}</h2>
            
            ${isOnline ? '<div style="background:white; padding:10px; margin:20px auto; width:150px; border: 4px solid #22d3ee;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=sevenbits@upi" alt="QR"></div>' : "<p style=\"margin:30px 0; font-family: 'Courier New', monospace; color: white;\">PAYMENT PENDING AT COUNTER.</p>"}
            
            <div style="display: grid; gap: 15px; margin-top: 20px;">
                <!-- MAIN ACTION -->
                <button class="btn-primary" style="background: #d97706; color: black; border: 2px solid black; padding: 15px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace; box-shadow: 4px 4px 0px #000;" onclick="window.printAndProcess('${method}')">PLACE ORDER</button>
                
                <!-- STYLED CANCEL BUTTON -->
                <button class="btn-close" 
                        style="background: transparent; color: #666; border: 2px solid #333; padding: 10px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace; transition: all 0.2s;" 
                        onmouseover="this.style.color='#fff'; this.style.borderColor='#fff';" 
                        onmouseout="this.style.color='#666'; this.style.borderColor='#333';"
                        onclick="document.getElementById('payment-overlay').remove()">
                    BACK
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.finalizeOrder = () => {
    // This is now handled within printAndProcess to avoid iPad timing bugs
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
            alert("SYSTEM IDLE: Select bits.");
        }
    });
}

window.closeModal = () => document.getElementById("modal-overlay")?.remove();
window.toggleTip = (check) => {
    tipApplied = check;
    window.closeModal();
    document.getElementById("cart-status").click();
};
window.removeServiceCharge = () => {
    serviceChargeActive = false;
    window.closeModal();
    document.getElementById("cart-status").click();
};

/**
 * 1. FIXED ANIMATION (Now accepts the message argument)
 */
window.triggerGingerAnimation = (message) => {
    // Added 'message' parameter
    const alertBox = document.createElement("div");
    alertBox.style.cssText = `
        position: fixed; 
        bottom: 30px; 
        left: -300px; 
        background: #d97706; 
        color: black; 
        padding: 12px 25px; 
        z-index: 10000; 
        border: 2px solid black; 
        font-family: 'Courier New', monospace;
        font-weight: bold;
        box-shadow: 5px 5px 0px black;
        transition: all 1s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    `;
    alertBox.innerText = message; // This now has a valid reference
    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.style.left = "20px";
    }, 100);
    setTimeout(() => {
        alertBox.style.left = "110%";
        setTimeout(() => alertBox.remove(), 1000);
    }, 4000);
};

window.showPage("home");

/**
 * GLOBAL EVENT LISTENERS
 */
document.addEventListener("click", (event) => {
    const jumpMenu = document.getElementById("jump-menu");
    const jumpButton = document.querySelector(".btn-jump-fab");

    // If the menu is open...
    if (jumpMenu && jumpMenu.style.display === "block") {
        // Check if the click was OUTSIDE the menu AND the button
        if (!jumpMenu.contains(event.target) && !jumpButton.contains(event.target)) {
            jumpMenu.style.display = "none";
        }
    }
});
