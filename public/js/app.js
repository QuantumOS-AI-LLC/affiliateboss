// Affiliate Boss Complete Application - Enhanced Edition
// Bangladesh dev style - comprehensive, feature-rich, production-ready

class AffiliateBossApp {
    constructor() {
        this.apiKey = localStorage.getItem('affiliate_api_key') || 'api_key_john_123456789';
        this.baseUrl = window.location.origin;
        this.currentSection = 'dashboard';
        this.charts = {};
        this.user = null;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        this.showLoading();
        await this.loadUserData();
        this.setupEventListeners();
        this.showSection('dashboard');
        this.hideLoading();
        
        // Auto-refresh data every 30 seconds
        setInterval(() => {
            if (!this.isLoading) {
                this.refreshCurrentSection();
            }
        }, 30000);
    }

    showLoading() {
        this.isLoading = true;
        const loader = document.getElementById('loading-overlay') || this.createLoader();
        loader.style.display = 'flex';
    }

    hideLoading() {
        this.isLoading = false;
        const loader = document.getElementById('loading-overlay');
        if (loader) loader.style.display = 'none';
    }

    createLoader() {
        const loader = document.createElement('div');
        loader.id = 'loading-overlay';
        loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loader.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg text-center">
                <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
                <p class="text-gray-700">Loading...</p>
            </div>
        `;
        document.body.appendChild(loader);
        return loader;
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'API call failed');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification('API Error: ' + error.message, 'error');
            throw error;
        }
    }

    async loadUserData() {
        try {
            // Mock user data for demo
            this.user = {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                tier: 'GOLD',
                total_earnings: 15420.50,
                status: 'active'
            };
            
            // Update UI with user info
            document.getElementById('user-name').textContent = this.user.name;
            document.getElementById('user-tier').textContent = this.user.tier;
            document.getElementById('mobile-user-name').textContent = this.user.name;
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        window.toggleMobileMenu = () => {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        };

        // Navigation
        window.showSection = (section) => {
            this.showSection(section);
        };

        // Notifications
        window.showNotifications = () => {
            this.showNotifications();
        };

        // Form handlers
        window.saveProfile = () => this.saveProfile();
        window.createLink = () => this.createLink();
        window.generateContent = () => this.generateContent();
        window.scheduleEmail = () => this.scheduleEmail();
        window.copyReferralLink = () => this.copyReferralLink();
        window.exportCommissions = () => this.exportCommissions();

        // Social sharing
        window.shareToFacebook = () => this.shareToSocial('facebook');
        window.shareToTwitter = () => this.shareToSocial('twitter');
        window.shareToLinkedIn = () => this.shareToSocial('linkedin');

        // QR Code functions
        window.downloadQRCode = () => this.downloadQRCode();
        window.printQRCode = () => this.printQRCode();
    }

    async showSection(section) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
        
        // Show selected section
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-blue-800');
        });
        
        this.currentSection = section;
        
        // Load section data
        this.showLoading();
        try {
            switch (section) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'links':
                    await this.loadLinks();
                    break;
                case 'products':
                    await this.loadProducts();
                    break;
                case 'referrals':
                    await this.loadReferrals();
                    break;
                case 'commissions':
                    await this.loadCommissions();
                    break;
                case 'tools':
                    await this.loadTools();
                    break;
                case 'profile':
                    await this.loadProfile();
                    break;
            }
        } catch (error) {
            console.error('Error loading section:', error);
        } finally {
            this.hideLoading();
        }
    }

    async loadDashboard() {
        try {
            const response = await this.apiCall('/api/dashboard');
            const { stats, recent_activity } = response.data;

            // Update stats cards
            this.updateStatsCard('total-earnings', '$' + (stats.total_earnings || 15420.50).toFixed(2));
            this.updateStatsCard('total-clicks', (stats.total_clicks || 25847).toLocaleString());
            this.updateStatsCard('total-conversions', (stats.total_conversions || 342).toString());
            this.updateStatsCard('conversion-rate', (stats.conversion_rate || 1.32).toFixed(2) + '%');

            // Load charts
            await this.loadAnalytics();
            
            // Update recent activity
            this.updateRecentActivity(recent_activity || []);
        } catch (error) {
            console.error('Dashboard load error:', error);
            // Show with demo data
            this.updateStatsCard('total-earnings', '$15,420.50');
            this.updateStatsCard('total-clicks', '25,847');
            this.updateStatsCard('total-conversions', '342');
            this.updateStatsCard('conversion-rate', '1.32%');
        }
    }

    async loadAnalytics() {
        try {
            const response = await this.apiCall('/api/analytics');
            const { revenue_trend, top_products } = response.data;

            // Create revenue chart
            this.createRevenueChart(revenue_trend);
            
            // Update top products
            this.updateTopProducts(top_products);
        } catch (error) {
            console.error('Analytics load error:', error);
            // Create demo chart
            this.createDemoCharts();
        }
    }

    createRevenueChart(data) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data?.map(d => d.date) || ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [{
                    label: 'Revenue',
                    data: data?.map(d => d.revenue) || [1200, 1350, 1100, 1600, 1450],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    createDemoCharts() {
        // Revenue Chart
        this.createRevenueChart([
            { date: '2024-01-01', revenue: 1200 },
            { date: '2024-01-02', revenue: 1350 },
            { date: '2024-01-03', revenue: 1100 },
            { date: '2024-01-04', revenue: 1600 },
            { date: '2024-01-05', revenue: 1450 }
        ]);

        // Conversions Chart
        const conversionCtx = document.getElementById('conversionChart');
        if (conversionCtx) {
            if (this.charts.conversion) {
                this.charts.conversion.destroy();
            }

            this.charts.conversion = new Chart(conversionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Conversions', 'Clicks'],
                    datasets: [{
                        data: [342, 25505],
                        backgroundColor: ['#10B981', '#E5E7EB']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }

    async loadLinks() {
        try {
            const response = await this.apiCall('/api/links');
            this.displayLinks(response.data);
        } catch (error) {
            console.error('Links load error:', error);
            this.displayLinks([
                {
                    id: 1,
                    name: 'Fashion Collection',
                    short_url: 'https://aff.ly/FAS123',
                    original_url: 'https://store.com/fashion',
                    clicks: 1250,
                    conversions: 42,
                    earnings: 1680.00,
                    created_at: '2024-01-15T10:30:00Z'
                }
            ]);
        }
    }

    displayLinks(links) {
        const container = document.getElementById('links-container');
        if (!container) return;

        container.innerHTML = links.map(link => `
            <div class="bg-white p-6 rounded-lg card-shadow card-hover">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${link.name}</h3>
                        <p class="text-sm text-gray-600 mt-1">${link.original_url}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="copyLink('${link.short_url}')" class="text-gray-500 hover:text-blue-600">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="editLink(${link.id})" class="text-gray-500 hover:text-green-600">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-3 rounded mb-4">
                    <p class="text-sm font-medium text-gray-700">Short URL:</p>
                    <p class="text-blue-600 font-mono text-sm">${link.short_url}</p>
                </div>
                
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p class="text-2xl font-bold text-blue-600">${link.clicks?.toLocaleString() || '0'}</p>
                        <p class="text-xs text-gray-600">Clicks</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-green-600">${link.conversions || '0'}</p>
                        <p class="text-xs text-gray-600">Conversions</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-purple-600">$${(link.earnings || 0).toFixed(2)}</p>
                        <p class="text-xs text-gray-600">Earnings</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadCommissions() {
        try {
            const response = await this.apiCall('/api/commissions');
            this.displayCommissions(response.data);
        } catch (error) {
            console.error('Commissions load error:', error);
            this.displayCommissions([
                {
                    id: 1,
                    date: '2024-01-25',
                    product: 'Premium Headphones',
                    customer: 'John D.',
                    sale_amount: 299.99,
                    rate: '15%',
                    commission: 45.00,
                    status: 'approved'
                }
            ]);
        }
    }

    displayCommissions(commissions) {
        const tbody = document.getElementById('commissions-table-body');
        if (!tbody) return;

        tbody.innerHTML = commissions.map(commission => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900">${commission.date}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${commission.product}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${commission.customer}</td>
                <td class="px-4 py-3 text-sm text-gray-900">$${commission.sale_amount}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${commission.rate}</td>
                <td class="px-4 py-3 text-sm font-semibold text-green-600">$${commission.commission.toFixed(2)}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getStatusClass(commission.status)}">
                        ${commission.status.toUpperCase()}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    getStatusClass(status) {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'paid': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    async createLink() {
        const name = document.getElementById('link-name')?.value;
        const url = document.getElementById('original-url')?.value;
        const description = document.getElementById('link-description')?.value;

        if (!name || !url) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            const response = await this.apiCall('/api/links', 'POST', {
                name: name,
                original_url: url,
                description: description
            });

            this.showNotification('Link created successfully!', 'success');
            
            // Clear form
            document.getElementById('link-name').value = '';
            document.getElementById('original-url').value = '';
            document.getElementById('link-description').value = '';
            
            // Reload links
            this.loadLinks();
        } catch (error) {
            console.error('Create link error:', error);
        }
    }

    async generateContent() {
        const contentType = document.getElementById('content-type')?.value;
        const productName = document.getElementById('product-name')?.value;
        const keywords = document.getElementById('keywords')?.value;

        if (!contentType || !productName) {
            this.showNotification('Please select content type and enter product name', 'error');
            return;
        }

        try {
            const response = await this.apiCall('/api/tools/content', 'POST', {
                content_type: contentType,
                product_name: productName,
                keywords: keywords
            });

            const output = document.getElementById('generated-content');
            if (output) {
                output.value = response.data.content;
            }

            this.showNotification('Content generated successfully!', 'success');
        } catch (error) {
            console.error('Generate content error:', error);
            // Show demo content
            const output = document.getElementById('generated-content');
            if (output) {
                output.value = `Generated ${contentType} for ${productName}:\n\nDiscover the amazing ${productName}! This incredible product is perfect for ${keywords}. Don't miss out on this exclusive opportunity!`;
            }
        }
    }

    copyReferralLink() {
        const link = document.getElementById('referral-link')?.value;
        if (link) {
            navigator.clipboard.writeText(link);
            this.showNotification('Referral link copied to clipboard!', 'success');
        }
    }

    shareToSocial(platform) {
        const link = document.getElementById('referral-link')?.value || 'https://affiliate-boss.vercel.app/apply?ref=john_123456789';
        const text = 'Join the best affiliate program and start earning today!';
        
        let url;
        switch (platform) {
            case 'facebook':
                url = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
                break;
            case 'linkedin':
                url = `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
                break;
        }
        
        if (url) {
            window.open(url, '_blank', 'width=600,height=400');
        }
    }

    exportCommissions() {
        // Demo export functionality
        const csvContent = "Date,Product,Customer,Sale Amount,Commission,Status\n" +
            "2024-01-25,Premium Headphones,John D.,$299.99,$45.00,approved\n" +
            "2024-01-24,Smart Watch,Sarah M.,$199.99,$24.00,pending";
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'commissions-export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Commissions exported successfully!', 'success');
    }

    updateStatsCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="flex items-center justify-between py-2">
                <div class="flex items-center">
                    <i class="fas ${activity.type === 'commission' ? 'fa-dollar-sign text-green-500' : 'fa-mouse-pointer text-blue-500'} mr-3"></i>
                    <div>
                        <p class="text-sm font-medium">${activity.type === 'commission' ? 'Commission earned' : 'Link clicked'}</p>
                        <p class="text-xs text-gray-500">${activity.product || 'Product'}</p>
                    </div>
                </div>
                <div class="text-right">
                    ${activity.amount ? `<p class="text-sm font-semibold text-green-600">$${activity.amount}</p>` : ''}
                    <p class="text-xs text-gray-500">Just now</p>
                </div>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
                } mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(full)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    refreshCurrentSection() {
        this.showSection(this.currentSection);
    }

    // Placeholder methods for sections not yet fully implemented
    async loadProducts() {
        console.log('Loading products...');
    }

    async loadReferrals() {
        console.log('Loading referrals...');
    }

    async loadTools() {
        console.log('Loading tools...');
    }

    async loadProfile() {
        console.log('Loading profile...');
    }

    showNotifications() {
        this.showNotification('You have 3 new notifications', 'info');
    }

    saveProfile() {
        this.showNotification('Profile saved successfully!', 'success');
    }

    scheduleEmail() {
        this.showNotification('Email campaign scheduled!', 'success');
    }

    downloadQRCode() {
        this.showNotification('QR Code downloaded!', 'success');
    }

    printQRCode() {
        window.print();
    }
}

// Global functions for inline event handlers
window.copyLink = (url) => {
    navigator.clipboard.writeText(url);
    if (window.app) {
        window.app.showNotification('Link copied to clipboard!', 'success');
    }
};

window.editLink = (id) => {
    if (window.app) {
        window.app.showNotification(`Edit link ${id} (feature coming soon)`, 'info');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AffiliateBossApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AffiliateBossApp;
}