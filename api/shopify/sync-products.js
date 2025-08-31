// Shopify Product Sync API - Complete Integration
// Bangladesh dev style - robust Shopify product synchronization

const { initDatabase } = require('../../lib/database');

// Mock Shopify API integration (replace with actual Shopify API in production)
async function fetchShopifyProducts(shopDomain, accessToken) {
    // This would be replaced with actual Shopify API call
    // const shopify = new Shopify({ shopName: shopDomain, accessToken });
    
    // Demo Shopify products
    const demoProducts = [
        {
            id: 'gid://shopify/Product/1',
            title: 'iPhone 15 Pro Max 256GB',
            handle: 'iphone-15-pro-max-256gb',
            description: 'Latest iPhone with Pro camera system and titanium design.',
            vendor: 'Apple',
            product_type: 'Smartphone',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            variants: [{
                id: 'gid://shopify/ProductVariant/1',
                title: 'Natural Titanium',
                price: '1199.99',
                compare_at_price: '1299.99',
                sku: 'IPHONE-15-PRO-MAX-256-NAT',
                inventory_quantity: 50,
                weight: 221,
                weight_unit: 'g'
            }],
            images: [{
                id: 'gid://shopify/ProductImage/1',
                src: 'https://cdn.shopify.com/s/files/1/0001/0002/products/iphone-15-pro-max.jpg',
                alt: 'iPhone 15 Pro Max Natural Titanium',
                width: 800,
                height: 800
            }],
            options: [
                { name: 'Color', values: ['Natural Titanium', 'Blue Titanium', 'White Titanium'] },
                { name: 'Storage', values: ['128GB', '256GB', '512GB', '1TB'] }
            ],
            tags: ['smartphone', 'apple', 'iphone', 'pro', 'new']
        },
        {
            id: 'gid://shopify/Product/2', 
            title: 'Nike Air Jordan 1 Retro High',
            handle: 'nike-air-jordan-1-retro-high',
            description: 'Classic basketball shoe with timeless style and premium materials.',
            vendor: 'Nike',
            product_type: 'Footwear',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            variants: [{
                id: 'gid://shopify/ProductVariant/2',
                title: 'Bred / Size 10',
                price: '170.00',
                compare_at_price: '200.00',
                sku: 'AJ1-RETRO-HIGH-BRED-10',
                inventory_quantity: 25,
                weight: 500,
                weight_unit: 'g'
            }],
            images: [{
                id: 'gid://shopify/ProductImage/2',
                src: 'https://cdn.shopify.com/s/files/1/0001/0002/products/air-jordan-1-bred.jpg',
                alt: 'Nike Air Jordan 1 Retro High Bred',
                width: 800,
                height: 800
            }],
            options: [
                { name: 'Size', values: ['8', '8.5', '9', '9.5', '10', '10.5', '11', '12'] },
                { name: 'Colorway', values: ['Bred', 'Chicago', 'Royal'] }
            ],
            tags: ['shoes', 'nike', 'jordan', 'basketball', 'retro']
        },
        {
            id: 'gid://shopify/Product/3',
            title: 'MacBook Pro M3 14-inch',
            handle: 'macbook-pro-m3-14-inch',
            description: 'Professional laptop with M3 chip for demanding workflows.',
            vendor: 'Apple',
            product_type: 'Laptop',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            variants: [{
                id: 'gid://shopify/ProductVariant/3',
                title: 'Space Gray / 512GB SSD / 18GB RAM',
                price: '1999.99',
                compare_at_price: '2199.99',
                sku: 'MBP-M3-14-SG-512-18',
                inventory_quantity: 15,
                weight: 1600,
                weight_unit: 'g'
            }],
            images: [{
                id: 'gid://shopify/ProductImage/3',
                src: 'https://cdn.shopify.com/s/files/1/0001/0002/products/macbook-pro-m3.jpg',
                alt: 'MacBook Pro M3 14-inch Space Gray',
                width: 800,
                height: 800
            }],
            options: [
                { name: 'Color', values: ['Space Gray', 'Silver'] },
                { name: 'Storage', values: ['512GB SSD', '1TB SSD', '2TB SSD'] },
                { name: 'Memory', values: ['18GB', '36GB'] }
            ],
            tags: ['laptop', 'apple', 'macbook', 'pro', 'professional']
        }
    ];

    return {
        products: demoProducts,
        hasNextPage: false,
        cursor: null
    };
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const db = await initDatabase();

        // Get API key from headers
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ success: false, error: 'API key required' });
        }

        // Verify affiliate exists (for merchant, we'd check merchant_api_key)
        const affiliate = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM affiliates WHERE api_key = ?', [apiKey], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!affiliate) {
            return res.status(401).json({ success: false, error: 'Invalid API key' });
        }

        // Get Shopify integration settings (mock for demo)
        const shopifySettings = {
            shop_domain: process.env.SHOPIFY_SHOP_DOMAIN || 'demo-fashion.myshopify.com',
            access_token: process.env.SHOPIFY_ACCESS_TOKEN || 'demo_access_token'
        };

        // Fetch products from Shopify
        const shopifyResponse = await fetchShopifyProducts(
            shopifySettings.shop_domain,
            shopifySettings.access_token
        );

        let syncedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        // Process each product
        for (const shopifyProduct of shopifyResponse.products) {
            try {
                // Get primary variant (first variant or lowest priced)
                const primaryVariant = shopifyProduct.variants[0];
                const primaryImage = shopifyProduct.images[0];

                // Calculate default commission rate based on price
                const price = parseFloat(primaryVariant.price);
                let defaultCommissionRate = 10; // Default 10%
                if (price > 1000) defaultCommissionRate = 8;    // 8% for expensive items
                if (price > 500) defaultCommissionRate = 12;    // 12% for mid-range
                if (price < 100) defaultCommissionRate = 15;    // 15% for lower-priced items

                // Check if product already exists
                const existingProduct = await new Promise((resolve, reject) => {
                    db.get(`
                        SELECT * FROM products 
                        WHERE shopify_product_id = ? OR (name = ? AND price = ?)
                    `, [
                        shopifyProduct.id,
                        shopifyProduct.title,
                        primaryVariant.price
                    ], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (existingProduct) {
                    // Update existing product
                    await new Promise((resolve, reject) => {
                        db.run(`
                            UPDATE products SET
                                name = ?,
                                description = ?,
                                price = ?,
                                image_url = ?,
                                category = ?,
                                vendor = ?,
                                sku = ?,
                                inventory_quantity = ?,
                                shopify_handle = ?,
                                shopify_tags = ?,
                                updated_at = datetime('now'),
                                last_synced = datetime('now')
                            WHERE id = ?
                        `, [
                            shopifyProduct.title,
                            shopifyProduct.description,
                            primaryVariant.price,
                            primaryImage?.src || null,
                            shopifyProduct.product_type || 'General',
                            shopifyProduct.vendor,
                            primaryVariant.sku,
                            primaryVariant.inventory_quantity,
                            shopifyProduct.handle,
                            shopifyProduct.tags.join(', '),
                            existingProduct.id
                        ], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    updatedCount++;
                } else {
                    // Insert new product
                    await new Promise((resolve, reject) => {
                        db.run(`
                            INSERT INTO products (
                                name, description, price, commission_rate, image_url,
                                category, vendor, sku, inventory_quantity,
                                shopify_product_id, shopify_variant_id, shopify_handle, shopify_tags,
                                status, created_at, updated_at, last_synced
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'), datetime('now'))
                        `, [
                            shopifyProduct.title,
                            shopifyProduct.description,
                            primaryVariant.price,
                            defaultCommissionRate,
                            primaryImage?.src || null,
                            shopifyProduct.product_type || 'General',
                            shopifyProduct.vendor,
                            primaryVariant.sku,
                            primaryVariant.inventory_quantity,
                            shopifyProduct.id,
                            primaryVariant.id,
                            shopifyProduct.handle,
                            shopifyProduct.tags.join(', ')
                        ], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    syncedCount++;
                }

            } catch (error) {
                console.error(`Error processing product ${shopifyProduct.title}:`, error);
                errorCount++;
            }
        }

        // Update sync statistics
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR REPLACE INTO shopify_sync_logs (
                    affiliate_id, sync_type, products_synced, products_updated, 
                    errors_count, sync_duration, created_at
                ) VALUES (?, 'manual', ?, ?, ?, 0, datetime('now'))
            `, [affiliate.id, syncedCount, updatedCount, errorCount], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Update affiliate's Shopify sync stats
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE affiliates 
                SET shopify_last_sync = datetime('now'),
                    shopify_products_synced = shopify_products_synced + ?,
                    shopify_sync_count = shopify_sync_count + 1
                WHERE id = ?
            `, [syncedCount, affiliate.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({
            success: true,
            count: syncedCount + updatedCount,
            details: {
                synced: syncedCount,
                updated: updatedCount,
                errors: errorCount,
                total: shopifyResponse.products.length
            },
            shopDomain: shopifySettings.shop_domain,
            syncTime: new Date().toISOString()
        });

    } catch (error) {
        console.error('Shopify Sync Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync Shopify products'
        });
    }
};