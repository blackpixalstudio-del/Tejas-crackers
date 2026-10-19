# Cracker Shop Billing

Billing, stock, products, Excel import/export, dashboard with profit reports, WhatsApp bill sharing, themes and automatic backups.

## Folder structure
- `index.html` - open this file
- `assets/css`, `assets/js` - app styles and code
- `assets/vendor` - optional offline Excel library (see README.txt inside)
- `images/` - your logo and pictures
- `backups/` - downloaded backup files
- `templates/product-import-template.xlsx` - Excel template for importing products

## Run it
1. Double-click `index.html` (Chrome or Edge recommended).
2. Bookmark it. Always open it from the same place and the same browser, because data is stored inside that browser.

## Put it online (one link for phone and computer)
Zip this folder (or drag the folder) onto https://app.netlify.com/drop . You get a link that works on any device. Each browser/device keeps its own separate shop data.

## Data and backups
- Data is saved in the browser (IndexedDB), not on a server.
- Automatic backup runs every 1 minute by default (Settings > Automatic backup) and keeps recent snapshots in the browser.
- Settings > Download backup file saves everything to a file. Do this regularly and keep copies in `backups/`.
- Chrome/Edge on a computer: Settings > Choose backup & images folder saves backups and images to a real folder.

## Importing products
Existing products are kept. For codes that already exist, the imported stock is ADDED to current stock (or skipped, or details updated, as you choose). New codes become new products. Do not import the same file twice unless you want its stock added twice (the app warns you).

## Limits
No staff logins or roles: anyone who opens the app has full access. No purchases, suppliers, customers, expenses or returns screens yet. WhatsApp sending opens WhatsApp with the message ready; you tap Send.
