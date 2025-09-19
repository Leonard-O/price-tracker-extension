// background.js

// This background service worker handles periodic price checking and notifications,
// listens for messages from popup or content scripts, and manages background tasks.

const CHECK_INTERVAL_MINUTES = 15; // Check every 15 minutes

// Start the periodic alarm for price checking
chrome.alarms.create('priceCheckAlarm', { periodInMinutes: CHECK_INTERVAL_MINUTES });

// Listen for the alarm to trigger price checks
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'priceCheckAlarm') {
        console.log('Price check alarm triggered');
        checkPricesAndNotify();
    }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    if (message.action === 'manualPriceCheck') {
        checkPricesAndNotify().then(() => {
            sendResponse({ status: 'Price check completed' });
        });
        return true; // Indicates async response
    }
    // Add other message handlers as needed
});

// Function to check prices and send notifications if price drops below target
async function checkPricesAndNotify() {
    try {
        // Get stored target price and last known product info
        const data = await chrome.storage.local.get(['targetPrice', 'lastTitle', 'lastPrice']);
        if (!data.targetPrice || !data.lastTitle) {
            console.log('No target price or product title stored, skipping check');
            return;
        }

        // Query active tabs matching Jumia product pages
        const tabs = await chrome.tabs.query({ url: '*://www.jumia.co.ke/*' });
        if (!tabs || tabs.length === 0) {
            console.log('No active Jumia tabs found for price check');
            return;
        }

        // For simplicity, check the first matching tab
        const tabId = tabs[0].id;

        // Execute script in the tab to get current product data
        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                // This function runs in the context of the page
                const titleElement = document.querySelector('h1.-fs20.-pts.-pbxs');
                const priceElement = document.querySelector('span.-b.-ubpt.-tal.-fs24.-prxs');
                const title = titleElement ? titleElement.innerText : null;
                let priceText = priceElement ? priceElement.innerText : null;
                let price = null;
                if (priceText) {
                    price = priceText.replace(/[^\d]/g, '');
                }
                return { title, price };
            }
        });

        if (!result || !result.result) {
            console.log('Failed to retrieve product data from tab');
            return;
        }

        const currentData = result.result;
        console.log('Current product data:', currentData);

        if (!currentData.title || !currentData.price) {
            console.log('Incomplete product data, skipping notification');
            return;
        }

        // Compare current price with target price
        const currentPriceNum = parseInt(currentData.price, 10);
        const targetPriceNum = parseInt(data.targetPrice, 10);

        if (isNaN(currentPriceNum) || isNaN(targetPriceNum)) {
            console.log('Invalid price values, skipping notification');
            return;
        }

        if (currentPriceNum <= targetPriceNum) {
            // Send notification about price drop
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Price Drop Alert!',
                message: `The price of "${currentData.title}" has dropped to KSh ${currentPriceNum}, which is below your target price of KSh ${targetPriceNum}.`,
                priority: 2
            });
        }

        // Update stored last price and title
        await chrome.storage.local.set({
            lastTitle: currentData.title,
            lastPrice: currentData.price
        });

        console.log('Price check completed and storage updated');
    } catch (error) {
        console.error('Error during price check:', error);
    }
}