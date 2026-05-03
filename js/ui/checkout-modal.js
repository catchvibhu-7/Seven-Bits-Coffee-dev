/**
 * SEVEN BITS COFFEE - CHECKOUT UI
 * Location: /js/ui/checkout-modal.js
 */
import { CartSystem } from "../features/cart-logic.js";
import { AdminConfig } from "../features/config-logic.js";

export function renderCheckoutModal(cartItems, serviceChargeActive, tipApplied = false) {
    const config = AdminConfig.loadSettings();
    const breakdown = CartSystem.calculateBreakdown(cartItems);

    let finalTotal = breakdown.total;
    if (!serviceChargeActive) finalTotal -= breakdown.serviceCharge;
    if (config.tipEnabled && tipApplied) finalTotal += config.tipAmount;

    
    const modalHtml = `
    <div id="modal-overlay" class="modal-overlay">
        <div class="modal-content" style="border: 2px solid #d97706; background: #111; color: #f9fafb; padding: 30px; width: 400px; font-family: 'Courier New', monospace;">
            <h2 style="letter-spacing: 2px; border-bottom: 1px solid #d97706; padding-bottom: 10px; margin-top:0;">07 //<br> TRANSACTION SUMMARY</h2>
            
            <div class="cart-items-list" style="max-height: 200px; overflow-y: auto; margin: 15px 0;">
                ${cartItems.map((item) => `
                    <div class="cart-row" style="border-bottom: 1px dashed #222; padding: 5px 0; font-size: 9pt; display: flex; justify-content: space-between;">
                        <span style="color: #d97706; font-weight: bold; width: 35px; display: inline-block;">${item.quantity}x</span>
                        <span style="flex: 1; text-align: left;">${item.name} <span style="color: #666;">@₹${item.price}</span></span>
                        <span style="font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join("")}
            </div>

            <div class="breakdown-window" style="background: #000; padding: 10px; border: 1px solid #222; margin-bottom: 20px;">
                <div class="calc-row" style="display: flex; justify-content: space-between; margin-bottom: 5px;">SUBTOTAL: <span>₹${breakdown.subtotal.toFixed(2)}</span></div>
                <div class="calc-row" style="display: flex; justify-content: space-between; font-size: 8pt; color: #888;">CGST (9.5%): <span>₹${breakdown.cgst.toFixed(2)}</span></div>
                <div class="calc-row" style="display: flex; justify-content: space-between; font-size: 8pt; color: #888;">SGST (9.5%): <span>₹${breakdown.sgst.toFixed(2)}</span></div>
                
                ${serviceChargeActive ? `
                <div class="calc-row" style="display: flex; justify-content: space-between; font-size: 8pt; color: #888;">SERVICE CHARGE (2%): <span>₹${breakdown.serviceCharge.toFixed(2)}</span></div>` : ""
                }

                ${config.tipEnabled ? `
                <div class="calc-row tip-row" style="color: #d97706; border: 1px dashed #d97706; padding: 5px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 9pt;">GINGER_TIP (₹7):</span>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" ${tipApplied ? "checked" : ""} onchange="window.toggleTip(this.checked)">
                        ADD
                    </label>
                </div>` : ""
                }

                <div class="calc-row total-row" style="display: flex; justify-content: space-between; border-top: 1px solid #d97706; padding-top: 10px; margin-top: 5px; font-weight:bold; font-size: 1.2rem; color: #d97706;">
                    TOTAL BITS: <span>₹${finalTotal.toFixed(2)}</span>
                </div>
            </div>

            <div class="payment-options" style="display: grid; gap: 10px;">
                <button class="btn-pay" onclick="window.processPayment('COUNTER')" style="background: #d97706; color: black; border: none; padding: 12px; font-weight: bold; cursor: pointer; text-transform: uppercase;">PAY CASH</button>
                <button class="btn-pay" style="background: #22d3ee; color: black; border: none; padding: 12px; font-weight: bold; cursor: pointer; text-transform: uppercase;" onclick="window.processPayment('ONLINE')">PAY ONLINE (UPI)</button>
            </div>
            
            <button class="btn-close" onclick="window.closeModal()" style="margin-top: 15px; width: 100%; background: #333; color: white; border: none; padding: 10px; cursor: pointer; text-transform: uppercase;">BACK</button>

            ${serviceChargeActive ? `
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="window.removeServiceCharge()" style="background:none; border:none; color:#333; font-size: 7pt; cursor:pointer; text-decoration: underline; font-family: inherit;">
                    Opt-out of Service Charge
                </button>
            </div>` : ""
            }
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
}