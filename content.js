// content.js

function getProductData() {
    // Grab product title
    let titleElement = document.querySelector("h1.-fs20.-pts.-pbxs");
    let title = titleElement ? titleElement.innerText : "No product detected";

    // Grab product price
    let priceElement = document.querySelector("span.-b.-ubpt.-tal.-fs24.-prxs");
    let priceText = priceElement ? priceElement.innerText : "";

    let price = "N/A";
    if (priceText) {
        price = priceText.replace(/[^\d]/g, ""); // keep only numbers
    }

    console.log("Scraped product data:", { title, price });

    return {
        title: title.trim(),
        price: price && price !== "" ? price : "N/A",
    };
}

console.log("Content script loaded and running");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getProductData") {
        const data = getProductData();
        console.log("Sending product data:", data);
        sendResponse(data);
    }
});