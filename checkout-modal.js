import { CartSystem } from './cart-logic.js';
import { AdminConfig } from './config-logic.js';

export function renderCheckoutModal(cartItems, serviceChargeActive, tipApplied = false) {
    const config = AdminConfig.loadSettings();
    const breakdown = CartSystem.calculateBreakdown(cartItems, serviceChargeActive);
    
    // Add Ginger Tip if enabled and user selected it
    let finalTotal = breakdown.total;
    if (config.tipEnabled && tipApplied) {
        finalTotal += config.tipAmount;
    }

    const modalHtml = `
    <div id="modal-overlay" class="modal-overlay">
        <div class="modal-content">
            <h2>07 // TRANSACTION SUMMARY</h2>
            <div class="cart-items-list">
                ${cartItems.map(item => `
                    <div class="cart-row">
                        <span>${item.name}</span>
                        <span>₹${item.price}</span>
                    </div>
                `).join('')}
            </div>

            <hr>

            <div class="breakdown-window">
                <div class="calc-row">Subtotal: <span>₹${breakdown.subtotal.toFixed(2)}</span></div>
                <div class="calc-row">CGST (9.5%): <span>₹${breakdown.cgst.toFixed(2)}</span></div>
                <div class="calc-row">SGST (9.5%): <span>₹${breakdown.sgst.toFixed(2)}</span></div>
                
                ${serviceChargeActive ? `
                <div class="calc-row service-charge-row">
                    SC (2%): <span>₹${breakdown.serviceCharge.toFixed(2)}</span>
                    <button class="btn-remove" onclick="window.removeServiceCharge()">[REMOVE]</button>
                </div>` : ''}

                ${config.tipEnabled ? `
                <div class="calc-row tip-row" style="color: #d97706; border: 1px dashed #d97706; padding: 5px; margin: 10px 0;">
                    <span>Ginger Tip (G=7):</span>
                    <label>
                        <input type="checkbox" ${tipApplied ? 'checked' : ''} onchange="window.toggleTip(this.checked)">
                        +₹${config.tipAmount}.00
                    </label>
                </div>` : ''}

                <div class="calc-row total-row">TOTAL BITS: <span>₹${finalTotal.toFixed(2)}</span></div>
            </div>

            <div class="payment-options">
                <button class="btn-pay" onclick="window.processPayment('COUNTER')">COUNTER</button>
                <button class="btn-pay" onclick="window.processPayment('ONLINE')">ONLINE</button>
            </div>
            
            <button class="btn-close" onclick="window.closeModal()">CLOSE SYSTEM</button>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}