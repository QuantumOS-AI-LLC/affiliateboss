// Shopify Integration API for Vercel
// Connect and manage Shopify stores
// Bangladesh dev style - robust e-commerce integration

const { getDatabase, authenticateUser, createErrorResponse, createSuccessResponse } = require('../../lib/database');
const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-Key,Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get API key from headers or query
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
      return res.status(401).json(createErrorResponse('API key required', 401));
    }

    // Authenticate user
    const user = authenticateUser(apiKey);
    if (!user) {
      return res.status(401).json(createErrorResponse('Invalid API key', 401));
    }

    const db = getDatabase();

    // GET - Get connected Shopify stores
    if (req.method === 'GET') {
      const stores = db.prepare(`
        SELECT 
          id, name, shopify_domain, store_url, owner_email, 
          country_code, currency, plan_name, products_count,
          orders_count, total_revenue, commission_earned,
          status, connection_status, last_sync, created_at
        FROM shopify_stores 
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(user.id);

      const responseData = {
        stores: stores.map(store => ({
          ...store,
          total_revenue: parseFloat(store.total_revenue || 0).toFixed(2),
          commission_earned: parseFloat(store.commission_earned || 0).toFixed(2)
        })),
        total_stores: stores.length,
        active_stores: stores.filter(s => s.status === 'connected').length
      };

      return res.status(200).json(createSuccessResponse(responseData, 'Shopify stores retrieved successfully'));
    }

    // POST - Connect new Shopify store
    if (req.method === 'POST') {
      const {
        shop_domain,
        access_token,
        store_name
      } = req.body;

      if (!shop_domain || !access_token) {
        return res.status(400).json(createErrorResponse('Shop domain and access token required', 400));
      }

      // Validate Shopify domain format
      if (!shop_domain.includes('.myshopify.com') && !shop_domain.includes('.shopify.com')) {
        return res.status(400).json(createErrorResponse('Invalid Shopify domain format', 400));
      }

      // Test connection to Shopify
      let shopifyData = null;
      let connectionStatus = 'error';

      try {
        const shopifyApiUrl = `https://${shop_domain}/admin/api/2023-10/shop.json`;
        
        const response = await axios.get(shopifyApiUrl, {
          headers: {
            'X-Shopify-Access-Token': access_token,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        shopifyData = response.data.shop;
        connectionStatus = 'healthy';

      } catch (error) {
        console.error('Shopify connection test failed:', error.message);
        
        // In demo mode, create mock data
        if (process.env.NODE_ENV === 'development' || !process.env.SHOPIFY_API_KEY) {
          shopifyData = {
            name: store_name || 'Demo Store',
            domain: shop_domain,
            email: user.email,
            country_code: 'US',
            currency: 'USD',
            plan_name: 'basic',
            products_count: 150,
            orders_count: 1250
          };
          connectionStatus = 'demo';
        } else {
          return res.status(400).json(createErrorResponse('Failed to connect to Shopify store', 400, {
            error: error.message,
            suggestion: 'Please verify your shop domain and access token'
          }));
        }
      }

      // Check if store already exists
      const existingStore = db.prepare(`
        SELECT id FROM shopify_stores 
        WHERE shopify_domain = ? OR (user_id = ? AND name = ?)
      `).get(shop_domain, user.id, shopifyData.name);

      if (existingStore) {
        return res.status(409).json(createErrorResponse('Store already connected', 409));
      }

      // Insert new store
      const storeData = {
        user_id: user.id,
        name: shopifyData.name,
        shopify_domain: shop_domain,
        store_url: `https://${shopifyData.domain || shop_domain}`,
        access_token: access_token, // In production, encrypt this
        owner_email: shopifyData.email || user.email,
        country_code: shopifyData.country_code || 'US',
        currency: shopifyData.currency || 'USD',
        plan_name: shopifyData.plan_name || 'basic',
        products_count: shopifyData.products_count || 0,
        orders_count: shopifyData.orders_count || 0,
        total_revenue: 0,
        commission_earned: 0,
        status: 'connected',
        connection_status: connectionStatus,
        auto_sync_enabled: true,
        sync_frequency: 'daily',
        commission_default: 15.0,
        last_sync: new Date().toISOString(),
        next_sync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      const result = db.prepare(`
        INSERT INTO shopify_stores (
          user_id, name, shopify_domain, store_url, access_token,
          owner_email, country_code, currency, plan_name,
          products_count, orders_count, total_revenue, commission_earned,
          status, connection_status, auto_sync_enabled, sync_frequency,
          commission_default, last_sync, next_sync, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        storeData.user_id, storeData.name, storeData.shopify_domain, storeData.store_url,
        storeData.access_token, storeData.owner_email, storeData.country_code,
        storeData.currency, storeData.plan_name, storeData.products_count,
        storeData.orders_count, storeData.total_revenue, storeData.commission_earned,
        storeData.status, storeData.connection_status, storeData.auto_sync_enabled,
        storeData.sync_frequency, storeData.commission_default, storeData.last_sync,
        storeData.next_sync
      );

      // Sync initial products if connection is successful
      if (connectionStatus === 'healthy' || connectionStatus === 'demo') {
        try {
          await syncShopifyProducts(result.lastInsertRowid, access_token, shop_domain, db);
        } catch (error) {
          console.error('Initial product sync failed:', error.message);
          // Don't fail the connection, just log the error
        }
      }

      const responseData = {
        store_id: result.lastInsertRowid,
        name: storeData.name,
        domain: storeData.shopify_domain,
        status: storeData.status,
        connection_status: connectionStatus,
        products_count: storeData.products_count,
        commission_rate: storeData.commission_default
      };

      if (connectionStatus === 'demo') {
        responseData.demo_mode = true;
        responseData.message = 'Demo connection created - no actual Shopify integration';
      }

      return res.status(201).json(createSuccessResponse(responseData, 'Shopify store connected successfully'));
    }

    // PUT - Update store settings
    if (req.method === 'PUT') {
      const { store_id } = req.query;
      const {
        commission_default,
        auto_sync_enabled,
        sync_frequency
      } = req.body;

      if (!store_id) {
        return res.status(400).json(createErrorResponse('Store ID required', 400));
      }

      // Check if store belongs to user
      const store = db.prepare(`
        SELECT * FROM shopify_stores WHERE id = ? AND user_id = ?
      `).get(store_id, user.id);

      if (!store) {
        return res.status(404).json(createErrorResponse('Store not found', 404));
      }

      // Update store settings
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (commission_default !== undefined) {
        updateData.commission_default = commission_default;
      }

      if (auto_sync_enabled !== undefined) {
        updateData.auto_sync_enabled = auto_sync_enabled;
      }

      if (sync_frequency !== undefined) {
        updateData.sync_frequency = sync_frequency;
        // Update next sync time based on frequency
        const hours = sync_frequency === 'hourly' ? 1 : sync_frequency === 'daily' ? 24 : 168; // weekly
        updateData.next_sync = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }

      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updateData), store_id, user.id];

      db.prepare(`
        UPDATE shopify_stores SET ${setClause} WHERE id = ? AND user_id = ?
      `).run(...values);

      const updatedStore = db.prepare(`
        SELECT * FROM shopify_stores WHERE id = ? AND user_id = ?
      `).get(store_id, user.id);

      return res.status(200).json(createSuccessResponse(updatedStore, 'Store settings updated successfully'));
    }

    // DELETE - Disconnect store
    if (req.method === 'DELETE') {
      const { store_id } = req.query;

      if (!store_id) {
        return res.status(400).json(createErrorResponse('Store ID required', 400));
      }

      // Check if store belongs to user
      const store = db.prepare(`
        SELECT * FROM shopify_stores WHERE id = ? AND user_id = ?
      `).get(store_id, user.id);

      if (!store) {
        return res.status(404).json(createErrorResponse('Store not found', 404));
      }

      // Soft delete by changing status
      db.prepare(`
        UPDATE shopify_stores 
        SET status = 'disconnected', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `).run(store_id, user.id);

      return res.status(200).json(createSuccessResponse(
        { store_id, status: 'disconnected' }, 
        'Store disconnected successfully'
      ));
    }

    return res.status(405).json(createErrorResponse('Method not allowed', 405));

  } catch (error) {
    console.error('Shopify integration error:', error);
    return res.status(500).json(createErrorResponse('Shopify integration failed', 500, error.message));
  }
};

// Helper function to sync Shopify products
async function syncShopifyProducts(storeId, accessToken, shopDomain, db) {
  try {
    let products = [];

    // In demo mode, create sample products
    if (process.env.NODE_ENV === 'development' || !process.env.SHOPIFY_API_KEY) {
      products = [
        {
          id: '12345',
          title: 'Premium Wireless Headphones',
          body_html: 'High-quality wireless headphones with noise cancellation.',
          vendor: 'TechBrand',
          product_type: 'Electronics',
          tags: 'audio,wireless,premium',
          variants: [{ price: '199.99', sku: 'TWH-001' }],
          images: [{ src: 'https://example.com/headphones.jpg' }]
        },
        {
          id: '12346',
          title: 'Organic Cotton T-Shirt',
          body_html: '100% organic cotton t-shirt, sustainably made.',
          vendor: 'EcoFashion',
          product_type: 'Apparel',
          tags: 'organic,cotton,sustainable',
          variants: [{ price: '29.99', sku: 'ECT-001' }],
          images: [{ src: 'https://example.com/tshirt.jpg' }]
        }
      ];
    } else {
      // Fetch real products from Shopify API
      const shopifyApiUrl = `https://${shopDomain}/admin/api/2023-10/products.json?limit=50`;
      
      const response = await axios.get(shopifyApiUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      products = response.data.products;
    }

    // Insert/update products in database
    for (const product of products) {
      const variant = product.variants?.[0] || {};
      const image = product.images?.[0] || {};
      
      // Calculate commission rate (15% default for demo)
      const commissionRate = 15.0;
      
      const productData = {
        name: product.title,
        description: product.body_html || '',
        price: parseFloat(variant.price || 0),
        category: product.product_type || 'General',
        vendor: product.vendor || 'Unknown',
        sku: variant.sku || `SKU-${product.id}`,
        commission_rate: commissionRate,
        commission_type: 'percentage',
        stock_quantity: variant.inventory_quantity || 0,
        tags: product.tags || '',
        shopify_product_id: product.id.toString(),
        shopify_store_id: storeId,
        image_url: image.src || null,
        status: 'active'
      };

      // Check if product already exists
      const existingProduct = db.prepare(`
        SELECT id FROM products 
        WHERE shopify_product_id = ? AND shopify_store_id = ?
      `).get(product.id.toString(), storeId);

      if (existingProduct) {
        // Update existing product
        db.prepare(`
          UPDATE products 
          SET name = ?, description = ?, price = ?, category = ?, 
              vendor = ?, sku = ?, stock_quantity = ?, tags = ?,
              image_url = ?, updated_at = CURRENT_TIMESTAMP
          WHERE shopify_product_id = ? AND shopify_store_id = ?
        `).run(
          productData.name, productData.description, productData.price,
          productData.category, productData.vendor, productData.sku,
          productData.stock_quantity, productData.tags, productData.image_url,
          product.id.toString(), storeId
        );
      } else {
        // Insert new product
        db.prepare(`
          INSERT INTO products (
            name, description, price, category, vendor, sku,
            commission_rate, commission_type, stock_quantity, tags,
            shopify_product_id, shopify_store_id, image_url, status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(
          productData.name, productData.description, productData.price,
          productData.category, productData.vendor, productData.sku,
          productData.commission_rate, productData.commission_type,
          productData.stock_quantity, productData.tags, productData.shopify_product_id,
          productData.shopify_store_id, productData.image_url, productData.status
        );
      }
    }

    // Update store's product count
    db.prepare(`
      UPDATE shopify_stores 
      SET products_count = ?, last_sync = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(products.length, storeId);

    console.log(`Synced ${products.length} products for store ${storeId}`);

  } catch (error) {
    console.error('Product sync error:', error);
    throw error;
  }
}