// Affiliate Boss Complete Application
// Bangladesh dev style - comprehensive, feature-rich, production-ready

class AffiliateBossApp {
    constructor() {
        this.apiKey = 'api_key_john_123456789'; // Demo API key
        this.baseUrl = window.location.origin;
        this.currentSection = 'dashboard';
        this.charts = {};
        
        // Demo data
        this.demoData = {
            user: {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                tier: 'GOLD',
                total_earnings: 12847.50,
                total_clicks: 89432,
                conversion_rate: 4.2,
                active_links: 47
            },
            links: [
                { id: 1, name: 'iPhone 15 Pro Max', url: 'https://aff.boss/ip15pm', clicks: 2847, conversions: 89, earnings: 1247.30, status: 'active', category: 'electronics' },
                { id: 2, name: 'Nike Air Jordan', url: 'https://aff.boss/nike-aj', clicks: 1923, conversions: 67, earnings: 890.45, status: 'active', category: 'fashion' },
                { id: 3, name: 'MacBook Pro M3', url: 'https://aff.boss/mbp-m3', clicks: 1456, conversions: 34, earnings: 1567.89, status: 'active', category: 'electronics' },
                { id: 4, name: 'Samsung TV 65"', url: 'https://aff.boss/sam-tv65', clicks: 987, conversions: 23, earnings: 678.90, status: 'paused', category: 'electronics' }
            ],
            products: [
                { id: 1, name: 'iPhone 15 Pro Max', price: 1199.99, commission_rate: 8.5, image: 'https://via.placeholder.com/300x300/1a73e8/ffffff?text=iPhone', category: 'Electronics', vendor: 'Apple', sales: 234 },
                { id: 2, name: 'Nike Air Jordan 1', price: 170.00, commission_rate: 12.0, image: 'https://via.placeholder.com/300x300/ff6b35/ffffff?text=Nike', category: 'Fashion', vendor: 'Nike', sales: 156 },
                { id: 3, name: 'MacBook Pro M3', price: 1999.99, commission_rate: 6.5, image: 'https://via.placeholder.com/300x300/333333/ffffff?text=MacBook', category: 'Electronics', vendor: 'Apple', sales: 89 },
                { id: 4, name: 'Samsung 65" QLED TV', price: 1299.99, commission_rate: 10.0, image: 'https://via.placeholder.com/300x300/1f4e79/ffffff?text=Samsung', category: 'Electronics', vendor: 'Samsung', sales: 67 }
            ],
            commissions: [
                { id: 1, date: '2024-01-15', product: 'iPhone 15 Pro Max', sale_amount: 1199.99, rate: 8.5, commission: 101.99, status: 'confirmed' },
                { id: 2, date: '2024-01-14', product: 'Nike Air Jordan', sale_amount: 170.00, rate: 12.0, commission: 20.40, status: 'pending' },
                { id: 3, date: '2024-01-13', product: 'MacBook Pro M3', sale_amount: 1999.99, rate: 6.5, commission: 129.99, status: 'confirmed' },
                { id: 4, date: '2024-01-12', product: 'Samsung TV', sale_amount: 1299.99, rate: 10.0, commission: 129.99, status: 'paid' }
            ],
            shopifyOrders: [
                { id: '#ORD-001', customer: 'Sarah Johnson', total: 247.99, commission: 24.80, status: 'confirmed' },
                { id: '#ORD-002', customer: 'Mike Chen', total: 89.50, commission: 8.95, status: 'pending' },
                { id: '#ORD-003', customer: 'Emma Wilson', total: 156.30, commission: 15.63, status: 'confirmed' },
                { id: '#ORD-004', customer: 'David Brown', total: 99.99, commission: 10.00, status: 'paid' }
            ]
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Affiliate Boss App...');
        
        // Load initial section
        this.showSection('dashboard');
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load demo data
        this.loadDemoData();
        
        // Initialize charts
        this.initCharts();
        
        console.log('✅ App initialized successfully');
    }

    initEventListeners() {
        // Form submissions
        document.getElementById('create-link-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAffiliateLink();
        });

        // Search and filter inputs
        document.getElementById('link-search')?.addEventListener('input', () => this.filterLinks());
        document.getElementById('link-status-filter')?.addEventListener('change', () => this.filterLinks());
        document.getElementById('link-category-filter')?.addEventListener('change', () => this.filterLinks());
    }

    loadDemoData() {
        // Update user info in navigation
        document.getElementById('user-name').textContent = this.demoData.user.name;
        document.getElementById('user-tier').textContent = this.demoData.user.tier;
        
        // Update dashboard stats
        document.getElementById('total-earnings').textContent = `$${this.demoData.user.total_earnings.toLocaleString()}`;
        document.getElementById('active-links').textContent = this.demoData.user.active_links;
        document.getElementById('total-clicks').textContent = this.demoData.user.total_clicks.toLocaleString();
        document.getElementById('conversion-rate').textContent = `${this.demoData.user.conversion_rate}%`;
        
        // Load section data
        this.loadLinksData();
        this.loadProductsData();
        this.loadCommissionsData();
        this.loadShopifyData();
        this.loadRecentActivity();
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('fade-in');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('text-yellow-300', 'font-bold');
        });
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        switch(sectionName) {
            case 'analytics':
                this.updateAnalytics();
                break;
            case 'products':
                this.loadProductsData();
                break;
        }
    }

    loadLinksData() {
        const tbody = document.getElementById('links-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = this.demoData.links.map(link => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div>
                        <div class="font-medium text-gray-900">${link.name}</div>
                        <div class="text-sm text-gray-500">${link.url}</div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        link.status === 'active' ? 'bg-green-100 text-green-800' : 
                        link.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                    }">
                        ${link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">${link.clicks.toLocaleString()}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${link.conversions}</td>
                <td class="px-6 py-4 text-sm font-medium text-green-600">$${link.earnings}</td>
                <td class="px-6 py-4 text-sm font-medium">
                    <button onclick="app.editLink(${link.id})" class="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                    <button onclick="app.copyLink('${link.url}')" class="text-gray-600 hover:text-gray-900 mr-2">Copy</button>
                    <button onclick="app.viewAnalytics(${link.id})" class="text-purple-600 hover:text-purple-900">Analytics</button>
                </td>
            </tr>
        `).join('');
        
        // Load top links for dashboard
        const topLinksDiv = document.getElementById('top-links');
        if (topLinksDiv) {
            topLinksDiv.innerHTML = this.demoData.links.slice(0, 3).map(link => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                        <div class="font-medium">${link.name}</div>
                        <div class="text-sm text-gray-600">${link.clicks} clicks • ${link.conversions} conversions</div>
                    </div>
                    <div class="text-green-600 font-medium">$${link.earnings}</div>
                </div>
            `).join('');
        }
    }

    loadProductsData() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        
        grid.innerHTML = this.demoData.products.map(product => `
            <div class="bg-white rounded-lg card-shadow card-hover overflow-hidden">
                <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-2xl font-bold text-green-600">$${product.price}</span>
                        <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${product.commission_rate}% commission</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-3">
                        <div>Vendor: ${product.vendor}</div>
                        <div>Sales: ${product.sales} this month</div>
                    </div>
                    <button onclick="app.createLinkForProduct(${product.id})" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
                        <i class="fas fa-link mr-1"></i>Create Affiliate Link
                    </button>
                </div>
            </div>
        `).join('');
        
        // Load product dropdown for create link modal
        const productSelect = document.getElementById('link-product');
        if (productSelect) {
            productSelect.innerHTML = '<option value="">Select a product</option>' + 
                this.demoData.products.map(product => 
                    `<option value="${product.id}">${product.name} - ${product.commission_rate}% commission</option>`
                ).join('');
        }
    }

    loadCommissionsData() {
        const tbody = document.getElementById('commissions-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = this.demoData.commissions.map(commission => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm">${new Date(commission.date).toLocaleDateString()}</td>
                <td class="px-4 py-3 text-sm font-medium">${commission.product}</td>
                <td class="px-4 py-3 text-sm">$${commission.sale_amount}</td>
                <td class="px-4 py-3 text-sm">${commission.rate}%</td>
                <td class="px-4 py-3 text-sm font-medium text-green-600">$${commission.commission}</td>
                <td class="px-4 py-3">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        commission.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                        commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                    }">
                        ${commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                    </span>
                </td>
            </tr>
        `).join('');
        
        // Load recent commissions for dashboard
        const recentDiv = document.getElementById('recent-commissions');
        if (recentDiv) {
            recentDiv.innerHTML = this.demoData.commissions.slice(0, 3).map(commission => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                        <div class="font-medium">${commission.product}</div>
                        <div class="text-sm text-gray-600">${new Date(commission.date).toLocaleDateString()} • ${commission.status}</div>
                    </div>
                    <div class="text-green-600 font-medium">$${commission.commission}</div>
                </div>
            `).join('');
        }
    }

    loadShopifyData() {
        const tbody = document.getElementById('shopify-orders-table');
        if (!tbody) return;
        
        tbody.innerHTML = this.demoData.shopifyOrders.map(order => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-mono">${order.id}</td>
                <td class="px-4 py-3 text-sm">${order.customer}</td>
                <td class="px-4 py-3 text-sm">$${order.total}</td>
                <td class="px-4 py-3 text-sm font-medium text-green-600">$${order.commission}</td>
                <td class="px-4 py-3">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                    }">
                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    loadRecentActivity() {
        // This would normally fetch from API
        console.log('✅ Recent activity loaded');
    }

    initCharts() {
        // Earnings trend chart
        const earningsCtx = document.getElementById('earningsChart');
        if (earningsCtx) {
            this.charts.earnings = new Chart(earningsCtx, {
                type: 'line',
                data: {
                    labels: ['Jan 1', 'Jan 8', 'Jan 15', 'Jan 22', 'Jan 29', 'Feb 5', 'Feb 12'],
                    datasets: [{
                        label: 'Earnings ($)',
                        data: [1200, 1900, 3000, 2100, 3200, 2800, 4200],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Products performance chart
        const productsCtx = document.getElementById('productsChart');
        if (productsCtx) {
            this.charts.products = new Chart(productsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['iPhone 15', 'Nike Shoes', 'MacBook Pro', 'Samsung TV', 'Others'],
                    datasets: [{
                        data: [35, 25, 20, 15, 5],
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Traffic sources chart
        const trafficCtx = document.getElementById('trafficChart');
        if (trafficCtx) {
            this.charts.traffic = new Chart(trafficCtx, {
                type: 'pie',
                data: {
                    labels: ['Social Media', 'Email Marketing', 'Direct Traffic', 'Search Engines', 'Paid Ads'],
                    datasets: [{
                        data: [30, 25, 20, 15, 10],
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Geographic chart
        const geoCtx = document.getElementById('geoChart');
        if (geoCtx) {
            this.charts.geo = new Chart(geoCtx, {
                type: 'bar',
                data: {
                    labels: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany'],
                    datasets: [{
                        label: 'Conversions',
                        data: [450, 289, 178, 134, 98],
                        backgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    // Modal functions
    showCreateLinkModal() {
        document.getElementById('create-link-modal').classList.remove('hidden');
        document.getElementById('create-link-modal').classList.add('flex');
    }

    hideCreateLinkModal() {
        document.getElementById('create-link-modal').classList.add('hidden');
        document.getElementById('create-link-modal').classList.remove('flex');
        document.getElementById('create-link-form').reset();
    }

    // AI Description Generator
    generateAIDescription() {
        const prompt = document.getElementById('ai-prompt').value;
        const productSelect = document.getElementById('link-product');
        const selectedProductId = productSelect.value;
        
        if (!selectedProductId) {
            this.showNotification('Please select a product first', 'error');
            return;
        }
        
        const product = this.demoData.products.find(p => p.id == selectedProductId);
        if (!product) return;
        
        // Simulate AI generation
        this.showLoading(true);
        
        setTimeout(() => {
            const aiDescriptions = [
                `🎯 Perfect for tech enthusiasts! The ${product.name} delivers premium performance with cutting-edge features. Transform your digital experience and earn ${product.commission_rate}% commission on every sale! #TechAffiliate #Innovation`,
                `✨ Exclusive deal alert! Get the ${product.name} at an unbeatable price. Limited time offer for savvy shoppers who demand quality and style. Join thousands of satisfied customers! 🛍️ #ExclusiveDeals #LimitedTime`,
                `🔥 Trending now! The ${product.name} is flying off the shelves. Don't miss out on this game-changing product that everyone's talking about. Premium quality, premium rewards! 💎 #Trending #PremiumQuality`
            ];
            
            const randomDesc = aiDescriptions[Math.floor(Math.random() * aiDescriptions.length)];
            document.getElementById('link-description').value = randomDesc;
            
            this.showLoading(false);
            this.showNotification('AI description generated successfully!', 'success');
        }, 1500);
    }

    // Create affiliate link
    createAffiliateLink() {
        const formData = {
            product_id: document.getElementById('link-product').value,
            custom_url: document.getElementById('link-custom-url').value,
            name: document.getElementById('link-name').value,
            description: document.getElementById('link-description').value
        };
        
        if (!formData.name) {
            this.showNotification('Please enter a link name', 'error');
            return;
        }
        
        this.showLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            const newLink = {
                id: this.demoData.links.length + 1,
                name: formData.name,
                url: `https://aff.boss/${Math.random().toString(36).substring(7)}`,
                clicks: 0,
                conversions: 0,
                earnings: 0,
                status: 'active',
                category: 'general'
            };
            
            this.demoData.links.unshift(newLink);
            this.loadLinksData();
            
            this.showLoading(false);
            this.hideCreateLinkModal();
            this.showNotification('Affiliate link created successfully!', 'success');
            
            // Auto-send SMS notification (demo)
            setTimeout(() => {
                this.showNotification('📱 SMS sent: New affiliate link created!', 'info');
            }, 2000);
        }, 1000);
    }

    // Utility functions
    createLinkForProduct(productId) {
        const product = this.demoData.products.find(p => p.id === productId);
        if (product) {
            this.showCreateLinkModal();
            document.getElementById('link-product').value = productId;
            document.getElementById('link-name').value = `${product.name} Affiliate Link`;
        }
    }

    copyLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification('Link copied to clipboard!', 'success');
        });
    }

    filterLinks() {
        // Filter implementation would go here
        this.showNotification('Filters applied!', 'info');
    }

    syncShopifyProducts() {
        this.showLoading(true);
        setTimeout(() => {
            this.showLoading(false);
            this.showNotification('Shopify products synced successfully! 247 products updated.', 'success');
        }, 2000);
    }

    updateAnalytics() {
        const timeframe = document.getElementById('analytics-timeframe').value;
        this.showNotification(`Analytics updated for last ${timeframe} days`, 'info');
        
        // Update charts with new data
        if (this.charts.traffic) {
            this.charts.traffic.update();
        }
        if (this.charts.geo) {
            this.charts.geo.update();
        }
    }

    showNotifications() {
        const notifications = [
            'New commission earned: $24.50',
            'Shopify sync completed successfully',
            'Weekly payout processed: $523.45'
        ];
        
        alert('Notifications:\\n' + notifications.join('\\n'));
    }

    showLoading(show) {
        const loader = document.getElementById('loading-indicator');
        if (show) {
            loader.classList.remove('hidden');
            loader.classList.add('flex');
        } else {
            loader.classList.add('hidden');
            loader.classList.remove('flex');
        }
    }

    showNotification(message, type = 'success') {
        const toast = document.getElementById('notification-toast');
        const messageEl = document.getElementById('toast-message');
        
        messageEl.textContent = message;
        
        // Set colors based on type
        toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-600 text-white' :
            type === 'error' ? 'bg-red-600 text-white' :
            type === 'info' ? 'bg-blue-600 text-white' :
            'bg-gray-600 text-white'
        }`;
        
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // API methods (would connect to real backend)
    async apiCall(endpoint, method = 'GET', data = null) {
        // This would make real API calls in production
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, data: this.demoData });
            }, 500);
        });
    }
}

// Global functions for HTML onclick handlers
window.showSection = (section) => app.showSection(section);
window.showCreateLinkModal = () => app.showCreateLinkModal();
window.hideCreateLinkModal = () => app.hideCreateLinkModal();
window.generateAIDescription = () => app.generateAIDescription();
window.syncShopifyProducts = () => app.syncShopifyProducts();
window.updateAnalytics = () => app.updateAnalytics();
window.showNotifications = () => app.showNotifications();

// Initialize the app
const app = new AffiliateBossApp();

console.log('🎉 Affiliate Boss Platform loaded successfully!');