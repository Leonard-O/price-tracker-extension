// popup.js

document.addEventListener("DOMContentLoaded", () => {
    const priceEl = document.getElementById("price");
    const titleEl = document.getElementById("productTitle");
    const lastPriceEl = document.getElementById("lastPrice");
    const statusEl = document.getElementById("status");
    const targetInput = document.getElementById("target");
    const targetPriceDisplay = document.getElementById("targetPrice");
    const saveBtn = document.getElementById("saveTarget");
    const refreshBtn = document.getElementById("refresh");

    // Fetch product data from content script
    function fetchProductData() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                console.error("No active tabs found");
                priceEl.textContent = "Not available";
                titleEl.textContent = "No product detected";
                lastPriceEl.textContent = "N/A";
                return;
            }
            const tabId = tabs[0].id;

            // Programmatically inject content.js if not already injected
            chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error("Script injection failed: ", chrome.runtime.lastError.message);
                        statusEl.textContent = "Failed to inject content script.";
                        return;
                    }

                    // After injection, send message to content script
                    chrome.tabs.sendMessage(
                        tabId, { action: "getProductData" },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                console.error("Error sending message to content script:", chrome.runtime.lastError.message);
                                priceEl.textContent = "Not available";
                                titleEl.textContent = "No product detected";
                                lastPriceEl.textContent = "N/A";
                                statusEl.textContent = "Please navigate to a Jumia product page.";
                                return;
                            }
                            if (!response) {
                                console.warn("No response from content script");
                                priceEl.textContent = "Not available";
                                titleEl.textContent = "No product detected";
                                lastPriceEl.textContent = "N/A";
                                statusEl.textContent = "No product data available.";
                                return;
                            }

                            console.log("Received product data:", response);
                            statusEl.textContent = "";

                            // Update UI
                            priceEl.textContent =
                                response.price && response.price !== "N/A" ?
                                `KSh ${response.price}` :
                                "N/A";
                            titleEl.textContent = response.title || "No product detected";
                            lastPriceEl.textContent =
                                response.price && response.price !== "N/A" ?
                                `KSh ${response.price}` :
                                "N/A";

                            // Save last scraped data
                            chrome.storage.local.set({
                                lastTitle: response.title,
                                lastPrice: response.price
                            }, () => {
                                console.log("Saved lastTitle and lastPrice to storage");
                            });
                        }
                    );
                }
            );
        });
    }

    // Load saved target price
    chrome.storage.local.get(["targetPrice"], (data) => {
        if (data.targetPrice) {
            targetInput.value = data.targetPrice;
        }
    });

    // Save target price
    saveBtn.addEventListener("click", () => {
        const target = targetInput.value;
        if (target) {
            chrome.storage.local.set({ targetPrice: target }, () => {
                console.log(`Target price saved: ${target}`);
                statusEl.textContent = `Target price saved: KSh ${target}`;
                targetPriceDisplay.textContent = `KSh ${target}`;
                targetInput.value = ""; // Clear input field after save
                setTimeout(() => (statusEl.textContent = ""), 2000);
            });
        }
    });

    // Refresh manually
    refreshBtn.addEventListener("click", () => {
        console.log("Refresh button clicked");
        fetchProductData();
    });

    // Manual trigger for price check notification - always visible
    const notifyBtn = document.createElement('button');
    notifyBtn.textContent = 'Check Price Now';
    notifyBtn.style.padding = '10px';
    notifyBtn.style.border = 'none';
    notifyBtn.style.borderRadius = '8px';
    notifyBtn.style.background = '#ff9900';
    notifyBtn.style.color = 'white';
    notifyBtn.style.cursor = 'pointer';
    notifyBtn.style.marginTop = '10px';
    notifyBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'manualPriceCheck' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending manualPriceCheck message:', chrome.runtime.lastError.message);
                statusEl.textContent = 'Failed to trigger price check.';
                return;
            }
            console.log('Manual price check response:', response);
            statusEl.textContent = response.status || 'Price check triggered.';
            setTimeout(() => (statusEl.textContent = ''), 3000);
        });
    });
    document.querySelector('.container').appendChild(notifyBtn);

    // Load saved product data
    chrome.storage.local.get(["lastTitle", "lastPrice"], (data) => {
        if (data.lastTitle) titleEl.textContent = data.lastTitle;
        if (data.lastPrice) lastPriceEl.textContent = `KSh ${data.lastPrice}`;
    });

    // Initial fetch
    fetchProductData();
});