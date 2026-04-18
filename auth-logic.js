export const SecuritySystem = {
    passcode: "1024", // Your default system access code
    
    checkAccess() {
        return sessionStorage.getItem('admin_auth') === 'true';
    },

    requestLogin() {
        const entry = prompt("SYSTEM ACCESS REQUIRED: ENTER ACCESS_BIT");
        if (entry === this.passcode) {
            sessionStorage.setItem('admin_auth', 'true');
            return true;
        }
        alert("ACCESS DENIED: INVALID PARITY BIT");
        return false;
    },

    logout() {
        sessionStorage.removeItem('admin_auth');
        window.showPage('home');
    }
};