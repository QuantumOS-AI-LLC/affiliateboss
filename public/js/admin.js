// Affiliate Boss Admin Panel - Vercel Edition
// Bangladesh dev style - comprehensive merchant management system

class AffiliateBossAdmin {
    constructor() {
        this.adminKey = localStorage.getItem('admin_api_key') || 'admin_key_demo_store_123';
        this.baseUrl = window.location.origin;
        this.currentSection = 'overview';
        this.charts = {};
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        this.showLoading();
        await this.loadAdminData();
        this.setupEventListeners();
        this.showSection('overview');
        this.hideLoading();
        
        // Auto-refresh data every 60 seconds
        setInterval(() => {
            if (!this.isLoading) {
                this.refreshCurrentSection();
            }
        }, 60000);
    }

    showLoading() {
        this.isLoading = true;
        const loader = document.getElementById('loading-overlay');
        if (loader) loader.style.display = 'flex';
    }

    hideLoading() {
        this.isLoading = false;
        const loader = document.getElementById('loading-overlay');
        if (loader) loader.style.display = 'none';
    }

    async adminApiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Key': this.adminKey
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseUrl}/api${endpoint}`, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error('Admin API Error:', error);
            this.showNotification('API Error: ' + error.message, 'error');
            throw error;
        }
    }

    async loadAdminData() {
        try {
            const response = await this.adminApiCall('/admin/overview');
            this.adminData = response.data;
            this.updateAdminUI();
        } catch (error) {
            console.error('Failed to load admin data:', error);
            // Use demo data as fallback
            this.loadDemoData();
        }
    }

    loadDemoData() {
        this.adminData = {
            store_info: {
                name: 'Demo Fashion Store',
                plan: 'Shopify Plus',
                currency: 'USD',
                total_products: 1250,
                active_affiliates: 89
            },
            affiliate_stats: {
                total_affiliates: 127,
                active_affiliates: 89,
                pending_affiliates: 23,
                suspended_affiliates: 8,
                growth_rate: '15.2'
            },
            sales_stats: {
                total_affiliate_sales: 89234.50,
                total_commissions_paid: 12847.30,
                total_orders: 342,
                avg_commission_rate: 12.5,
                sales_growth: '18.3',
                commission_growth: '22.1'
            },
            top_affiliates: [
                { id: 1, username: 'sarah_wilson', first_name: 'Sarah', last_name: 'Wilson', email: 'sarah@influencer.com', tier: 'platinum', total_earnings: 15670.50, total_clicks: 45230, total_conversions: 1847, conversion_rate: 4.08 },
                { id: 2, username: 'mike_chen', first_name: 'Mike', last_name: 'Chen', email: 'mike@blogosphere.com', tier: 'gold', total_earnings: 12340.25, total_clicks: 38940, total_conversions: 1234, conversion_rate: 3.17 },
                { id: 3, username: 'david_kim', first_name: 'David', last_name: 'Kim', email: 'david@techreviewer.com', tier: 'diamond', total_earnings: 23456.78, total_clicks: 67890, total_conversions: 2678, conversion_rate: 3.94 }
            ]
        };
        this.updateAdminUI();
    }

    updateAdminUI() {
        const storeNameElement = document.getElementById('store-name');
        if (storeNameElement && this.adminData.store_info) {
            storeNameElement.textContent = this.adminData.store_info.name;
        }
    }

    setupEventListeners() {
        // Navigation listeners
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Modal close listeners
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Form submission listeners
        this.setupFormListeners();
    }

    setupFormListeners() {
        // Invite affiliate form
        const inviteForm = document.getElementById('invite-affiliate-form');
        if (inviteForm) {
            inviteForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendAffiliateInvitation(new FormData(inviteForm));
            });
        }

        // Bulk message form
        const bulkMessageForm = document.getElementById('bulk-message-form');
        if (bulkMessageForm) {
            bulkMessageForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendBulkMessage(new FormData(bulkMessageForm));
            });
        }

        // Application review forms
        document.querySelectorAll('.approve-application').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const applicationId = e.target.dataset.applicationId;
                await this.processApplication(applicationId, 'approved', true);
            });
        });

        document.querySelectorAll('.reject-application').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const applicationId = e.target.dataset.applicationId;
                await this.processApplication(applicationId, 'rejected');
            });
        });
    }

    async showSection(sectionName) {
        this.currentSection = sectionName;
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-white', 'bg-opacity-20');
        });

        // Show selected section
        const section = document.getElementById(`${sectionName}-section`);
        if (section) {
            section.style.display = 'block';
            section.classList.add('fade-in');
        }

        // Highlight active nav item
        const activeNav = document.querySelector(`[href="#${sectionName}"]`);
        if (activeNav) {
            activeNav.classList.add('bg-white', 'bg-opacity-20');
        }

        // Load section data
        await this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        try {
            switch (sectionName) {
                case 'overview':
                    await this.loadOverviewData();
                    break;
                case 'affiliates':
                    await this.loadAffiliatesData();
                    break;
                case 'recruitment':
                    await this.loadRecruitmentData();
                    break;
                case 'commissions':
                    await this.loadCommissionsData();
                    break;
                case 'communications':
                    await this.loadCommunicationsData();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${sectionName} data:`, error);
        }
    }

    async loadOverviewData() {
        try {
            const response = await this.adminApiCall('/admin/overview');
            const data = response.data;
            
            // Update overview stats
            this.updateElement('total-affiliates', data.affiliate_stats.total_affiliates);
            this.updateElement('affiliate-sales', '$' + parseFloat(data.sales_stats.total_affiliate_sales).toLocaleString());
            this.updateElement('commissions-paid', '$' + parseFloat(data.sales_stats.total_commissions_paid).toLocaleString());
            this.updateElement('pending-applications', data.pending_applications || 0);

            // Update growth indicators
            this.updateGrowthIndicator('sales-growth', data.sales_stats.sales_growth);
            this.updateGrowthIndicator('commission-growth', data.sales_stats.commission_growth);

            // Render top affiliates
            this.renderTopAffiliates(data.top_affiliates);
            
            // Create overview charts
            this.createOverviewCharts(data);
            
        } catch (error) {
            this.loadDemoOverview();
        }
    }

    loadDemoOverview() {
        this.updateElement('total-affiliates', '127');
        this.updateElement('affiliate-sales', '$89,234');
        this.updateElement('commissions-paid', '$12,847');
        this.updateElement('pending-applications', '23');
        
        this.updateGrowthIndicator('sales-growth', '18.3');
        this.updateGrowthIndicator('commission-growth', '22.1');
        
        this.renderTopAffiliates(this.adminData.top_affiliates);
        this.createDemoCharts();
    }

    async loadAffiliatesData() {
        try {
            const response = await this.adminApiCall('/admin/affiliates');
            const affiliates = response.data.affiliates;
            this.renderAffiliatesTable(affiliates);
            this.updateAffiliateStats(response.data.summary);
        } catch (error) {
            this.renderDemoAffiliates();
        }
    }

    async loadRecruitmentData() {
        try {
            const response = await this.adminApiCall('/admin/applications');
            const applications = response.data.applications;
            this.renderApplications(applications);
        } catch (error) {
            this.renderDemoApplications();
        }
    }

    // Affiliate Management Functions
    async sendAffiliateInvitation(formData) {
        try {
            this.showLoading();
            
            const inviteData = {
                email: formData.get('invite-email'),
                first_name: formData.get('invite-name'),
                message: formData.get('invite-message'),
                commission_rate: parseFloat(formData.get('commission-rate')) || 10
            };

            const response = await this.adminApiCall('/admin/invite', 'POST', inviteData);
            
            this.showNotification('Invitation sent successfully!', 'success');
            this.closeAllModals();
            
        } catch (error) {
            this.showNotification('Failed to send invitation: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async processApplication(applicationId, status, createUser = false) {
        try {
            this.showLoading();
            
            const response = await this.adminApiCall(`/admin/applications?id=${applicationId}`, 'PUT', {
                status: status,
                create_user: createUser,
                admin_notes: status === 'approved' ? 'Application approved by admin' : 'Application rejected'
            });
            
            this.showNotification(`Application ${status} successfully!`, 'success');
            await this.loadRecruitmentData();
            
        } catch (error) {
            this.showNotification(`Failed to ${status} application: ` + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async updateAffiliateStatus(affiliateId, newStatus) {
        try {
            this.showLoading();
            
            const response = await this.adminApiCall(`/admin/affiliates?id=${affiliateId}`, 'PUT', {
                status: newStatus
            });
            
            this.showNotification('Affiliate status updated!', 'success');
            await this.loadAffiliatesData();
            
        } catch (error) {
            this.showNotification('Failed to update affiliate: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async updateAffiliateTier(affiliateId, newTier) {
        try {
            this.showLoading();
            
            const response = await this.adminApiCall(`/admin/affiliates?id=${affiliateId}`, 'PUT', {
                tier: newTier
            });
            
            this.showNotification('Affiliate tier updated!', 'success');
            await this.loadAffiliatesData();
            
        } catch (error) {
            this.showNotification('Failed to update tier: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async sendBulkMessage(formData) {
        try {
            this.showLoading();
            
            const messageData = {
                subject: formData.get('message-subject'),
                message: formData.get('message-content'),
                recipients: formData.get('message-recipients'), // 'all', 'active', 'tier-specific'
                tier: formData.get('target-tier') || null,
                send_sms: formData.get('send-sms') === 'on'
            };

            const response = await this.adminApiCall('/admin/messages', 'POST', messageData);
            
            this.showNotification('Bulk message sent successfully!', 'success');
            this.closeAllModals();
            
        } catch (error) {
            this.showNotification('Failed to send message: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // UI Rendering Functions
    renderTopAffiliates(affiliates) {
        const container = document.getElementById('top-affiliates-list');
        if (!container || !affiliates) return;

        container.innerHTML = affiliates.map((affiliate, index) => `
            <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        ${affiliate.first_name[0]}${affiliate.last_name[0]}
                    </div>
                    <div>
                        <div class="font-medium">${affiliate.first_name} ${affiliate.last_name}</div>
                        <div class="text-sm text-gray-500">${affiliate.email}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-semibold text-green-600">$${parseFloat(affiliate.total_earnings).toLocaleString()}</div>
                    <div class="text-sm text-gray-500">${affiliate.conversion_rate}% CVR</div>
                </div>
            </div>
        `).join('');
    }

    renderAffiliatesTable(affiliates) {
        const container = document.getElementById('affiliates-table-body');
        if (!container) return;

        container.innerHTML = affiliates.map(affiliate => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            ${affiliate.first_name[0]}${affiliate.last_name[0]}
                        </div>
                        <div class="ml-4">
                            <div class="font-medium text-gray-900">${affiliate.first_name} ${affiliate.last_name}</div>
                            <div class="text-sm text-gray-500">${affiliate.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getTierColor(affiliate.tier)}">
                        ${affiliate.tier.toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${affiliate.total_clicks}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${affiliate.total_conversions}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${affiliate.conversion_rate}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">$${parseFloat(affiliate.total_earnings).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        affiliate.status === 'active' ? 'bg-green-100 text-green-800' : 
                        affiliate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                    }">
                        ${affiliate.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex space-x-2">
                        <select onchange="admin.updateAffiliateTier(${affiliate.id}, this.value)" 
                                class="text-sm border rounded px-2 py-1">
                            <option value="bronze" ${affiliate.tier === 'bronze' ? 'selected' : ''}>Bronze</option>
                            <option value="silver" ${affiliate.tier === 'silver' ? 'selected' : ''}>Silver</option>
                            <option value="gold" ${affiliate.tier === 'gold' ? 'selected' : ''}>Gold</option>
                            <option value="premium" ${affiliate.tier === 'premium' ? 'selected' : ''}>Premium</option>
                            <option value="platinum" ${affiliate.tier === 'platinum' ? 'selected' : ''}>Platinum</option>
                            <option value="diamond" ${affiliate.tier === 'diamond' ? 'selected' : ''}>Diamond</option>
                        </select>
                        <select onchange="admin.updateAffiliateStatus(${affiliate.id}, this.value)" 
                                class="text-sm border rounded px-2 py-1">
                            <option value="active" ${affiliate.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="suspended" ${affiliate.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                            <option value="inactive" ${affiliate.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderApplications(applications) {
        const container = document.getElementById('applications-list');
        if (!container) return;

        container.innerHTML = applications.map(app => `
            <div class="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-semibold text-lg">${app.first_name} ${app.last_name}</h3>
                        <p class="text-gray-600">${app.email}</p>
                        <p class="text-sm text-gray-500">Applied: ${new Date(app.submitted_at).toLocaleDateString()}</p>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold text-blue-600">Score: ${app.application_score}/100</div>
                        <span class="px-2 py-1 rounded text-xs font-semibold ${
                            app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                        }">
                            ${app.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                        <span class="font-medium">Experience:</span> ${app.marketing_experience}
                    </div>
                    <div>
                        <span class="font-medium">Audience:</span> ${app.audience_size} followers
                    </div>
                    <div>
                        <span class="font-medium">Platforms:</span> ${JSON.parse(app.primary_platforms || '[]').join(', ')}
                    </div>
                    <div>
                        <span class="font-medium">Business:</span> ${app.business_type}
                    </div>
                </div>

                ${app.why_join ? `
                    <div class="mb-4">
                        <span class="font-medium text-sm">Why they want to join:</span>
                        <p class="text-sm text-gray-700 mt-1">${app.why_join}</p>
                    </div>
                ` : ''}

                ${app.status === 'pending' ? `
                    <div class="flex space-x-3">
                        <button onclick="admin.processApplication(${app.id}, 'approved', true)" 
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                            <i class="fas fa-check mr-1"></i> Approve & Create Account
                        </button>
                        <button onclick="admin.processApplication(${app.id}, 'rejected')" 
                                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                            <i class="fas fa-times mr-1"></i> Reject
                        </button>
                        <button onclick="admin.viewApplicationDetails(${app.id})" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                            <i class="fas fa-eye mr-1"></i> View Details
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Utility Functions
    getTierColor(tier) {
        const colors = {
            bronze: 'bg-orange-100 text-orange-800',
            silver: 'bg-gray-100 text-gray-800',
            gold: 'bg-yellow-100 text-yellow-800',
            premium: 'bg-purple-100 text-purple-800',
            platinum: 'bg-blue-100 text-blue-800',
            diamond: 'bg-pink-100 text-pink-800'
        };
        return colors[tier] || 'bg-gray-100 text-gray-800';
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    updateGrowthIndicator(id, growth) {
        const element = document.getElementById(id);
        if (element) {
            const isPositive = parseFloat(growth) >= 0;
            element.className = isPositive ? 'text-green-600' : 'text-red-600';
            element.innerHTML = `<i class="fas fa-arrow-${isPositive ? 'up' : 'down'} mr-1"></i> ${Math.abs(growth)}%`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600 text-white' :
            type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    closeAllModals() {
        document.querySelectorAll('[id$="-modal"]').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    async refreshCurrentSection() {
        await this.loadSectionData(this.currentSection);
    }

    // Chart Functions
    createOverviewCharts(data) {
        this.createAffiliateGrowthChart(data.commission_trends || []);
        this.createTierDistributionChart(data.tier_distribution || []);
    }

    createDemoCharts() {
        // Demo affiliate growth chart
        const growthCtx = document.getElementById('affiliate-growth-chart');
        if (growthCtx && !this.charts.growth) {
            this.charts.growth = new Chart(growthCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Active Affiliates',
                        data: [45, 52, 68, 73, 89, 127],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // Demo tier distribution chart
        const tierCtx = document.getElementById('tier-distribution-chart');
        if (tierCtx && !this.charts.tiers) {
            this.charts.tiers = new Chart(tierCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
                    datasets: [{
                        data: [25, 34, 42, 18, 8],
                        backgroundColor: [
                            '#cd7f32',
                            '#c0c0c0', 
                            '#ffd700',
                            '#e5e4e2',
                            '#b9f2ff'
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
    }

    // Demo data functions
    renderDemoAffiliates() {
        const demoAffiliates = [
            { id: 1, first_name: 'Sarah', last_name: 'Wilson', email: 'sarah@influencer.com', tier: 'platinum', status: 'active', total_clicks: 45230, total_conversions: 1847, conversion_rate: 4.08, total_earnings: 15670.50 },
            { id: 2, first_name: 'Mike', last_name: 'Chen', email: 'mike@blogosphere.com', tier: 'gold', status: 'active', total_clicks: 38940, total_conversions: 1234, conversion_rate: 3.17, total_earnings: 12340.25 },
            { id: 3, first_name: 'Emma', last_name: 'Rodriguez', email: 'emma@socialgenius.com', tier: 'silver', status: 'pending', total_clicks: 0, total_conversions: 0, conversion_rate: 0, total_earnings: 0 }
        ];
        this.renderAffiliatesTable(demoAffiliates);
    }

    renderDemoApplications() {
        const demoApplications = [
            {
                id: 1, first_name: 'Alex', last_name: 'Thompson', email: 'alex@lifestyle.blog',
                marketing_experience: 'intermediate', audience_size: 25000, 
                primary_platforms: '["instagram", "youtube"]', business_type: 'individual',
                why_join: 'Looking to monetize my lifestyle content with quality products',
                application_score: 78, status: 'pending', submitted_at: new Date().toISOString()
            },
            {
                id: 2, first_name: 'Maria', last_name: 'Garcia', email: 'maria@beauty.vlog',
                marketing_experience: 'expert', audience_size: 45000,
                primary_platforms: '["tiktok", "instagram", "youtube"]', business_type: 'business',
                why_join: 'Experienced beauty influencer seeking partnership opportunities',
                application_score: 92, status: 'pending', submitted_at: new Date().toISOString()
            }
        ];
        this.renderApplications(demoApplications);
    }
}

// Global functions for onclick events
function showSection(sectionName) {
    if (window.admin) {
        window.admin.showSection(sectionName);
    }
}

function showNotifications() {
    if (window.admin) {
        window.admin.showNotification('Notifications feature active!', 'info');
    }
}

// Initialize admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AffiliateBossAdmin();
});