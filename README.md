🛒 Jumia Price Tracker (Chrome Extension)

A simple Chrome Extension that helps you track product prices on Jumia.
You can set a target price, and the extension will monitor the current price. If the price drops to or below your target, you’ll know instantly!

✨ Features

📌 Automatically scrapes the product title and current price from Jumia product pages.

🎯 Allows you to set a target price.

🔄 Refresh button to update the latest price instantly.

💾 Saves target and product details using Chrome’s storage.local.

📱 Clean and modern popup UI.

📂 Project Structure
jumia-price-tracker/
│── manifest.json       # Extension configuration
│── popup.html          # Popup UI
│── popup.css           # Popup styling
│── popup.js            # Popup logic
│── content.js          # Script injected into Jumia pages to extract title & price
│── icons/              # Extension icons (16x16, 48x48, 128x128)

🚀 How It Works

Open a Jumia product page.

The content script (content.js) scrapes the product title and current price.

Data is saved in Chrome’s storage.

Open the popup to:

View the current price

Set your target price

Refresh the price

See tracked product details

🛠 Installation (Developer Mode)

Clone this repo:

git clone https://github.com/your-username/jumia-price-tracker.git
cd jumia-price-tracker


Open Chrome and go to:

chrome://extensions/


Enable Developer Mode (top-right corner).

Click Load unpacked and select the project folder.

The extension will now appear in your toolbar! 🎉


📌 To-Do / Future Improvements

⏰ Add price drop notifications.

📊 Track price history (charts).

🔔 Email or SMS alerts when the target price is reached.

🌍 Support more e-commerce sites (Amazon, Kilimall, etc).

🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open a PR or Issue.

📜 License

This project is licensed under the Realcode Devs – you’re free to use and modify it.
