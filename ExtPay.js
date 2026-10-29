
if (typeof window !== 'undefined') {
    window.addEventListener('message', event => {
        if (event.origin !== 'https://extensionpay.com' || event.source !== window) return;
        if (event.data === 'extpay-fetch-user') {
            window.postMessage('extpay-fetch-user-received');
            chrome.runtime.sendMessage('extpay-fetch-user').catch(() => {});
        }
    });
}

// ExtPay.js — Snip's ExtensionPay bridge
class ExtPayClient {
    constructor(extensionId) {
        this.extensionId = extensionId;
        this.onPaid = { listeners: [], addListener: cb => this.onPaid.listeners.push(cb) };
        this.HOST = 'https://extensionpay.com';
        this.EXTENSION_URL = `${this.HOST}/extension/${extensionId}`;
    }

    startBackground() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message === 'extpay-fetch-user') {
                this.pollUserPaid().then(async user => {
                    if (user?.paid) {
                        chrome.storage.local.set({ extpay_user: user });
                        const stored = await chrome.storage.local.get(['snip_payment_origin_tab']);
                        const origin = stored.snip_payment_origin_tab || this.originTabId;
                        if (origin) chrome.tabs.sendMessage(origin, { type: 'SNIP_PAYMENT_CONFIRMED', user }).catch(() => {});
                        if (sender?.tab?.id) chrome.tabs.remove(sender.tab.id).catch(() => {});
                        await chrome.storage.local.remove('snip_payment_origin_tab');
                    }
                    sendResponse({ ok: !!user?.paid });
                }).catch(error => {
                    console.error('ExtensionPay polling error:', error);
                    sendResponse({ ok: false, error: String(error?.message || error) });
                });
                return true;
            }
        });
    }

    async ensureApiKey() {
        const stored = await chrome.storage.local.get(['extensionpay_api_key']);
        if (stored.extensionpay_api_key) return stored.extensionpay_api_key;
        const response = await fetch(`${this.EXTENSION_URL}/api/new-key`, {
            method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ development: !chrome.runtime.getManifest().update_url })
        });
        if (!response.ok) throw new Error(`ExtensionPay key request failed (${response.status})`);
        const key = await response.json();
        await chrome.storage.local.set({ extensionpay_api_key: key });
        return key;
    }

    async getUser() {
        const stored = await chrome.storage.local.get(['extensionpay_api_key', 'extpay_user']);
        const apiKey = stored.extensionpay_api_key;
        if (!apiKey) return stored.extpay_user || { paid: false, plan: null };
        const response = await fetch(`${this.EXTENSION_URL}/api/v2/user?api_key=${encodeURIComponent(apiKey)}`, {
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`ExtensionPay user request failed (${response.status})`);
        const user = await response.json();
        await chrome.storage.local.set({ extpay_user: user });
        return user;
    }

    async getPlans() {
        const response = await fetch(`${this.EXTENSION_URL}/api/v2/current-plans`, {
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`ExtensionPay plans request failed (${response.status})`);
        return await response.json();
    }

    async openPaymentPage(planNickname) {
        const apiKey = await this.ensureApiKey();
        let url = `${this.EXTENSION_URL}/choose-plan?api_key=${encodeURIComponent(apiKey)}`;
        if (planNickname) url = `${this.EXTENSION_URL}/choose-plan/${encodeURIComponent(planNickname)}?api_key=${encodeURIComponent(apiKey)}`;
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        this.originTabId = tabs[0]?.id || null;
        await chrome.storage.local.set({ snip_payment_origin_tab: this.originTabId });
        await chrome.tabs.create({ url, active: true });
    }

    async pollUserPaid() {
        let user = await this.getUser();
        for (let i = 0; i < 120; i++) {
            if (user?.paid) return user;
            await new Promise(resolve => setTimeout(resolve, 1000));
            user = await this.getUser();
        }
        return user;
    }
}
function ExtPay(id) { return new ExtPayClient(id); }
