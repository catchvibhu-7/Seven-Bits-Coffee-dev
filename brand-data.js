export const menuData = {
    sections: [
        { id: "fast-sellers", title: "01: High Bandwidth", theme: "orange" },
        { id: "limited", title: "02: Beta Mode (Limited)", theme: "cyan" },
        { id: "classics", title: "03: Stable Build", theme: "orange" },
        { id: "savory", title: "04: Hardware (Savory)", theme: "orange" },
        { id: "sweets", title: "05: Sweet Bytes (Desserts)", theme: "orange" }
    ],
    items: [
        // --- 01: FAST SELLERS ---
        { id: 101, section: "fast-sellers", name: "G-Bit Latte", price: 240, icon: "hot", story: "Signature ginger-honey 'fur-mula'.",ingredients: { "coffee-beans": 18, "milk": 200, "ginger-honey": 7 } },
        { id: 102, section: "fast-sellers", name: "1024 Cold Brew", price: 260, icon: "iced", story: "Steeped 1024 mins for maximum clarity." },
        { id: 103, section: "fast-sellers", name: "Binary Black", price: 180, icon: "hot", story: "0 or 1. Just pure specialty espresso." },
        { id: 104, section: "fast-sellers", name: "The Bit-Shake", price: 290, icon: "iced", story: "Espresso frappe with dark chocolate chips." },
        { id: 105, section: "fast-sellers", name: "Vanilla Logic", price: 250, icon: "hot", story: "Latte with real Madagascar vanilla strings." },
        { id: 106, section: "fast-sellers", name: "Iced Aero-Am", price: 210, icon: "iced", story: "Aerated Americano. Coffee in the cloud." },
        { id: 107, section: "fast-sellers", name: "Daily Driver", price: 150, icon: "hot", story: "Batch brew. The stable, reliable drip." },

        // --- 02: LIMITED SERIES ---
        { id: 108, section: "limited", name: "Quantum Cortado", price: 220, icon: "hot", story: "Mystery bean. Observe to find the flavor." },
        { id: 109, section: "limited", name: "Neon Matcha Tonic", price: 280, icon: "matcha", story: "Ceremonial matcha + tonic. High refresh rate." },
        { id: 110, section: "limited", name: "The Birthday Bit", price: 310, icon: "hot", story: "7/7 Special. Salted caramel update." },
        { id: 111, section: "limited", name: "Schrödinger's Foam", price: 270, icon: "iced", story: "Daily secret foam flavor. Sip to solve." },
        { id: 112, section: "limited", name: "Iced Hibiscus", price: 190, icon: "iced", story: "Red-bit floral brew. Zero caffeine." },
        { id: 113, section: "limited", name: "0/1 Espresso Soda", price: 230, icon: "iced", story: "Binary bubbles. Citrus-espresso refresh." },
        { id: 114, section: "limited", name: "Honey Lemon Tea", price: 160, icon: "hot", story: "Local leaves. Debugging your stress." },

        // --- 03: STABLE BUILD ---
        { id: 115, section: "classics", name: "7-Bit Flat White", price: 230, icon: "hot", story: "G is the 7th letter. The 7oz gold standard." },
        { id: 116, section: "classics", name: "The Pure Pour", price: 320, icon: "hot", story: "Manual V60. Hand-filtering the noise." },
        { id: 117, section: "classics", name: "Traditional Cap", price: 220, icon: "hot", story: "1/3 Milk, 1/3 Foam, 1/3 Bean." },
        { id: 118, section: "classics", name: "G-Bit Macchiato", price: 190, icon: "hot", story: "Marked with foam. No overwriting espresso." },
        { id: 119, section: "classics", name: "The Double Bit", price: 160, icon: "hot", story: "Doppio. Two bits are better than one." },
        { id: 120, section: "classics", name: "Dark Matter Mocha", price: 280, icon: "hot", story: "70% cocoa. Heavier than a black hole." },
        { id: 121, section: "classics", name: "Affogato 7", price: 250, icon: "iced", story: "Vanilla gelato system crash." },

        // --- 04: SAVORY HARDWARE ---
        { id: 201, section: "savory", name: "Sourdough Avo Toast", price: 340, icon: "chip", story: "Geometric radish & high-fiber data." },
        { id: 202, section: "savory", name: "Smoked Chicken Panini", price: 380, icon: "chip", story: "Pesto-infused hardware. Hot pressed." },
        { id: 203, section: "savory", name: "The Byte Bagel", price: 190, icon: "chip", story: "Cream cheese cache. Simple & reliable." },
        { id: 204, section: "savory", name: "Mushroom Savory Tart", price: 260, icon: "chip", story: "Earthy bits. Thyme-calculated crust." },
        { id: 205, section: "savory", name: "Burrata Tomato", price: 420, icon: "chip", story: "Fresh heirloom data points." },
        { id: 206, section: "savory", name: "Spiced Paneer Wrap", price: 280, icon: "chip", story: "Local Hazaribagh flavor, optimized." },
        { id: 207, section: "savory", name: "Morning Quiche", price: 220, icon: "chip", story: "Fluffy egg-based boot sequence." },

        // --- 05: SWEET BYTES ---
        { id: 301, section: "sweets", name: "Orange Almond Cake", price: 210, icon: "cookie", story: "The flavor of Ginger. Burnt orange zest." },
        { id: 302, section: "sweets", name: "Dark Sea Salt Brownie", price: 180, icon: "cookie", story: "Deep, dense cocoa matter." },
        { id: 303, section: "sweets", name: "Butter Croissant", price: 160, icon: "cookie", story: "Flaky architecture. The classic." },
        { id: 304, section: "sweets", name: "Ginger-Snap Cookies", price: 110, icon: "cookie", story: "Bite-sized bits for Ginger fans." },
        { id: 305, section: "sweets", name: "Matcha Tiramisu", price: 290, icon: "cookie", story: "Greyscale caffeine fusion." },
        { id: 306, section: "sweets", name: "Blueberry Cheesecake", price: 320, icon: "cookie", story: "Rich, heavy-duty creamy build." },
        { id: 307, section: "sweets", name: "Espresso Macarons", price: 140, icon: "cookie", story: "Pixel-sized cold brew treats." }
    ],
    inventory: {
        "coffee-beans": 10000, // in grams
        "milk": 20000,         // in ml
        "ginger-honey": 500    // in grams
    },
};