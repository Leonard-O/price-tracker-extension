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

    // Grab product image
    let imageElement = document.querySelector("img.-fw.-fh");
    let imageUrl = imageElement ? imageElement.src : "";

    // Grab product page URL
    let productUrl = window.location.href;

    // Grab additional product details if available
    let originalPriceElement = document.querySelector("span.-tal.-gy5.-lthr.-fs16");
    let originalPrice = originalPriceElement ? originalPriceElement.innerText.replace(/[^\d]/g, "") : "";

    console.log("Scraped enhanced product data:", { title, price, imageUrl, productUrl, originalPrice });

    return {
        title: title.trim(),
        price: price && price !== "" ? price : "N/A",
        imageUrl: imageUrl,
        productUrl: productUrl,
        originalPrice: originalPrice && originalPrice !== "" ? originalPrice : "N/A",
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