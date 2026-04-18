export const AdminConfig = {
    settings: {
        shopName: "SEVEN BITS COFFEE",
        gstRate: 0.095, // 9.5%
        serviceChargeRate: 0.02,
        tipEnabled: true, // The "Ginger Tip" toggle
        tipAmount: 7,
        currency: "₹"
    },
    
    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('seven_bits_config', JSON.stringify(this.settings));
    },

    loadSettings() {
        const saved = localStorage.getItem('seven_bits_config');
        if (saved) this.settings = JSON.parse(saved);
        return this.settings;
    }
};