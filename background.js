// background.js

// This background service worker handles periodic price checking and notifications,
// listens for messages from popup or content scripts, and manages background tasks.

let CHECK_INTERVAL_MINUTES = 15; // Default check interval in minutes

// Load check interval from storage or use default
chrome.storage.local.get(['checkIntervalMinutes'], (data) => {
    if (data.checkIntervalMinutes && Number.isInteger(data.checkIntervalMinutes) && data.checkIntervalMinutes > 0) {
        CHECK_INTERVAL_MINUTES = data.checkIntervalMinutes;
    }
    // Start the periodic alarm for price checking
    chrome.alarms.create('priceCheckAlarm', { periodInMinutes: CHECK_INTERVAL_MINUTES });
});

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
        const data = await chrome.storage.local.get(['targetPrice', 'lastTitle', 'lastPrice', 'priceHistory']);
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
                const imageElement = document.querySelector('img.-fw.-fh');
                const originalPriceElement = document.querySelector('span.-tal.-gy5.-lthr.-fs16');

                const title = titleElement ? titleElement.innerText : null;
                let priceText = priceElement ? priceElement.innerText : null;
                let price = null;
                if (priceText) {
                    price = priceText.replace(/[^\d]/g, '');
                }
                const imageUrl = imageElement ? imageElement.src : '';
                const productUrl = window.location.href;
                let originalPrice = originalPriceElement ? originalPriceElement.innerText.replace(/[^\d]/g, '') : '';

                return { title, price, imageUrl, productUrl, originalPrice };
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

        // Update price history
        const priceHistory = data.priceHistory || [];
        const now = new Date().toISOString();
        priceHistory.push({
            price: currentPriceNum,
            timestamp: now,
            title: currentData.title
        });

        // Keep only last 10 price points
        if (priceHistory.length > 10) {
            priceHistory.splice(0, priceHistory.length - 10);
        }

        let shouldNotify = false;
        let notificationTitle = 'Price Update';
        let notificationMessage = '';

        if (currentPriceNum <= targetPriceNum) {
            shouldNotify = true;
            notificationTitle = '🎉 Price Drop Alert!';
            notificationMessage = `Great news! The price of "${currentData.title}" has dropped to KSh ${currentPriceNum}, which is below your target price of KSh ${targetPriceNum}.`;

            if (currentData.originalPrice && currentData.originalPrice !== "N/A") {
                const originalPriceNum = parseInt(currentData.originalPrice, 10);
                const savings = originalPriceNum - currentPriceNum;
                if (savings > 0) {
                    notificationMessage += `\n💰 You save KSh ${savings}!`;
                }
            }
        } else if (data.lastPrice && data.lastPrice !== "N/A") {
            // Check if price increased significantly
            const lastPriceNum = parseInt(data.lastPrice, 10);
            const priceIncrease = currentPriceNum - lastPriceNum;
            if (priceIncrease > 500) { // Notify if price increased by more than KSh 500
                shouldNotify = true;
                notificationTitle = '⚠️ Price Increase Alert';
                notificationMessage = `The price of "${currentData.title}" has increased to KSh ${currentPriceNum} (up KSh ${priceIncrease} from KSh ${lastPriceNum}).`;
            }
        }

        if (shouldNotify) {
            // Create rich notification with image
            const notificationOptions = {
                type: 'image',
                iconUrl: 'icons/icon128.png',
                title: notificationTitle,
                message: notificationMessage,
                priority: 2,
                imageUrl: currentData.imageUrl || 'icons/icon128.png'
            };

            // Add click action to open product page
            if (currentData.productUrl) {
                notificationOptions.buttons = [{ title: 'View Product' }];
                notificationOptions.data = { productUrl: currentData.productUrl };
            }

            chrome.notifications.create('priceAlert', notificationOptions);
        }

        // Update stored data
        await chrome.storage.local.set({
            lastTitle: currentData.title,
            lastPrice: currentData.price,
            lastImageUrl: currentData.imageUrl,
            lastProductUrl: currentData.productUrl,
            priceHistory: priceHistory
        });

        console.log('Price check completed and storage updated');
    } catch (error) {
        console.error('Error during price check:', error);
    }
}

// Handle notification click
chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === 'priceAlert') {
        chrome.storage.local.get(['lastProductUrl'], (data) => {
            if (data.lastProductUrl) {
                chrome.tabs.create({ url: data.lastProductUrl });
            }
        });
    }
});

// Handle notification button click
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId === 'priceAlert' && buttonIndex === 0) {
        chrome.storage.local.get(['lastProductUrl'], (data) => {
            if (data.lastProductUrl) {
                chrome.tabs.create({ url: data.lastProductUrl });
            }
        });
    }
});