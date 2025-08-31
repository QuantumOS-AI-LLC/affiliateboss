// Affiliate Boss Admin Panel
// Bangladesh dev style - comprehensive merchant management system

class AffiliateBossAdmin {
    constructor() {
        this.baseUrl = window.location.origin;
        this.currentSection = 'overview';
        this.charts = {};
        
        // Demo data for merchant admin
        this.adminData = {
            store: {
                name: 'Demo Fashion Store',
                plan: 'Shopify Plus',
                total_affiliates: 127,
                active_affiliates: 89,
                pending_applications: 23,
                affiliate_sales: 89234.50,
                commissions_paid: 12847.30
            },
            affiliates: [
                { id: 1, name: 'Sarah Wilson', email: 'sarah@influencer.com', status: 'active', tier: 'platinum', sales: 15670.50, commission: 2350.58, joined: '2024-01-15', avatar: 'https://via.placeholder.com/40/8b5cf6/ffffff?text=SW' },
                { id: 2, name: 'Mike Chen', email: 'mike@blogosphere.com', status: 'active', tier: 'gold', sales: 12340.25, commission: 1481.23, joined: '2024-01-20', avatar: 'https://via.placeholder.com/40/10b981/ffffff?text=MC' },
                { id: 3, name: 'Emma Rodriguez', email: 'emma@socialgenius.com', status: 'pending', tier: 'silver', sales: 0, commission: 0, joined: '2024-01-28', avatar: 'https://via.placeholder.com/40/f59e0b/ffffff?text=ER' },
                { id: 4, name: 'David Kim', email: 'david@techreviewer.com', status: 'active', tier: 'diamond', sales: 23456.78, commission: 5163.49, joined: '2024-01-10', avatar: 'https://via.placeholder.com/40/ef4444/ffffff?text=DK' },
                { id: 5, name: 'Lisa Johnson', email: 'lisa@fashionforward.com', status: 'active', tier: 'gold', sales: 9876.54, commission: 1185.18, joined: '2024-01-25', avatar: 'https://via.placeholder.com/40/3b82f6/ffffff?text=LJ' }
            ],
            recentApplications: [
                { name: 'Alex Thompson', email: 'alex@lifestyle.blog', niche: 'Lifestyle', followers: '25K', applied: '2 hours ago', status: 'pending' },
                { name: 'Maria Garcia', email: 'maria@beauty.vlog', niche: 'Beauty', followers: '45K', applied: '5 hours ago', status: 'pending' },
                { name: 'James Wilson', email: 'james@tech.reviews', niche: 'Technology', followers: '67K', applied: '1 day ago', status: 'pending' }
            ],
            recentMessages: [
                { from: 'Sarah Wilson', subject: 'New product promotion ideas', time: '2 hours ago', type: 'question', unread: true },
                { from: 'Mike Chen', subject: 'Commission payment inquiry', time: '4 hours ago', type: 'support', unread: false },
                { from: 'System', subject: 'Weekly performance report sent', time: '1 day ago', type: 'system', unread: false },
                { from: 'David Kim', subject: 'Marketing material request', time: '2 days ago', type: 'request', unread: false }
            ],
            commissionTiers: [
                { name: 'Bronze', rate: 8, requirements: 'New affiliates', color: '#cd7f32', affiliates: 25 },
                { name: 'Silver', rate: 10, requirements: '$1K+ monthly sales', color: '#c0c0c0', affiliates: 34 },
                { name: 'Gold', rate: 12, requirements: '$5K+ monthly sales', color: '#ffd700', affiliates: 42 },
                { name: 'Platinum', rate: 15, requirements: '$15K+ monthly sales', color: '#e5e4e2', affiliates: 18 },
                { name: 'Diamond', rate: 22, requirements: '$50K+ monthly sales', color: '#b9f2ff', affiliates: 8 }
            ]
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Affiliate Boss Admin Panel...');
        
        // Load initial section
        this.showSection('overview');
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load admin data
        this.loadAdminData();
        
        // Initialize charts
        this.initAdminCharts();
        
        console.log('✅ Admin panel initialized successfully');
    }

    initEventListeners() {
        // Form submissions
        document.getElementById('invite-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendAffiliateInvitation();
        });

        // Search and filter inputs
        document.getElementById('affiliate-search')?.addEventListener('input', () => this.filterAffiliates());
        document.getElementById('affiliate-tier-filter')?.addEventListener('change', () => this.filterAffiliates());
    }

    loadAdminData() {
        // Update store info
        document.getElementById('store-name').textContent = this.adminData.store.name;
        
        // Update overview stats
        document.getElementById('total-affiliates').textContent = this.adminData.store.total_affiliates;
        document.getElementById('affiliate-sales').textContent = `$${this.adminData.store.affiliate_sales.toLocaleString()}`;
        document.getElementById('commissions-paid').textContent = `$${this.adminData.store.commissions_paid.toLocaleString()}`;
        document.getElementById('pending-apps').textContent = this.adminData.store.pending_applications;
        
        // Load section data
        this.loadAffiliatesData();
        this.loadRecentApplications();
        this.loadRecentMessages();
        this.loadCommissionTiers();
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
            case 'affiliates':
                this.loadAffiliatesData();
                break;
            case 'commissions':
                this.updateCommissionAnalytics();
                break;
        }
    }

    loadAffiliatesData() {
        const tbody = document.getElementById('affiliates-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = this.adminData.affiliates.map(affiliate => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <img src="${affiliate.avatar}" alt="${affiliate.name}" class="w-10 h-10 rounded-full mr-3">
                        <div>
                            <div class="font-medium text-gray-900">${affiliate.name}</div>
                            <div class="text-sm text-gray-500">${affiliate.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        affiliate.status === 'active' ? 'bg-green-100 text-green-800' : 
                        affiliate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                    }">
                        ${affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getTierColor(affiliate.tier)}">
                        ${affiliate.tier.toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">$${affiliate.sales.toLocaleString()}</td>
                <td class="px-6 py-4 text-sm font-medium text-green-600">$${affiliate.commission.toLocaleString()}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${new Date(affiliate.joined).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="admin.viewAffiliate(${affiliate.id})" class="text-blue-600 hover:text-blue-900">View</button>
                        <button onclick="admin.editAffiliate(${affiliate.id})" class="text-indigo-600 hover:text-indigo-900">Edit</button>
                        ${affiliate.status === 'pending' ? 
                            `<button onclick="admin.approveAffiliate(${affiliate.id})" class="text-green-600 hover:text-green-900">Approve</button>` : 
                            `<button onclick="admin.messageAffiliate(${affiliate.id})" class="text-purple-600 hover:text-purple-900">Message</button>`
                        }
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadRecentApplications() {
        const container = document.getElementById('recent-applications');
        if (!container) return;
        
        container.innerHTML = this.adminData.recentApplications.map(app => `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div class="flex-1">
                    <div class="font-medium text-gray-900">${app.name}</div>
                    <div class="text-sm text-gray-600">${app.niche} • ${app.followers} followers</div>
                    <div class="text-xs text-gray-500">${app.applied}</div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="admin.approveApplication('${app.email}')" class="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200">
                        Approve
                    </button>
                    <button onclick="admin.rejectApplication('${app.email}')" class="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200">
                        Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadRecentMessages() {
        const container = document.getElementById('recent-messages');
        if (!container) return;
        
        container.innerHTML = this.adminData.recentMessages.map(msg => `
            <div class="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50">
                <div class="flex-1">
                    <div class="flex items-center">
                        <span class="font-medium text-gray-900">${msg.from}</span>
                        ${msg.unread ? '<span class="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>' : ''}
                        <span class="ml-auto text-sm text-gray-500">${msg.time}</span>
                    </div>
                    <div class="text-sm text-gray-600 mt-1">${msg.subject}</div>
                    <div class="flex items-center mt-2">
                        <span class="inline-flex px-2 py-1 text-xs rounded ${this.getMessageTypeColor(msg.type)}">
                            ${msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}
                        </span>
                    </div>
                </div>
                <button onclick="admin.replyToMessage('${msg.from}')" class="ml-4 text-blue-600 hover:text-blue-800">
                    <i class="fas fa-reply"></i>
                </button>
            </div>
        `).join('');
    }

    loadCommissionTiers() {
        const container = document.getElementById('tier-structure');
        if (!container) return;
        
        container.innerHTML = this.adminData.commissionTiers.map(tier => `
            <div class="flex items-center justify-between p-4 border rounded-lg">
                <div class="flex items-center">
                    <div class="w-4 h-4 rounded-full mr-3" style="background-color: ${tier.color}"></div>
                    <div>
                        <div class="font-medium">${tier.name} - ${tier.rate}%</div>
                        <div class="text-sm text-gray-600">${tier.requirements}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-medium">${tier.affiliates} affiliates</div>
                    <button onclick="admin.editTier('${tier.name.toLowerCase()}')" class="text-sm text-blue-600 hover:text-blue-800">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    initAdminCharts() {
        // Sales trend chart
        const salesTrendCtx = document.getElementById('salesTrendChart');
        if (salesTrendCtx) {
            this.charts.salesTrend = new Chart(salesTrendCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{
                        label: 'Affiliate Sales ($)',
                        data: [12000, 15000, 18000, 22000, 25000, 28000, 32000],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { callback: function(value) { return '$' + value.toLocaleString(); } }
                        }
                    }
                }
            });
        }

        // Top affiliates chart
        const topAffiliatesCtx = document.getElementById('topAffiliatesChart');
        if (topAffiliatesCtx) {
            this.charts.topAffiliates = new Chart(topAffiliatesCtx, {
                type: 'doughnut',
                data: {
                    labels: ['David Kim', 'Sarah Wilson', 'Mike Chen', 'Lisa Johnson', 'Others'],
                    datasets: [{
                        data: [23456, 15670, 12340, 9876, 15000],
                        backgroundColor: ['#ef4444', '#8b5cf6', '#10b981', '#3b82f6', '#f59e0b']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }

        // Commission analytics chart
        const commissionCtx = document.getElementById('commissionAnalyticsChart');
        if (commissionCtx) {
            this.charts.commissionAnalytics = new Chart(commissionCtx, {
                type: 'bar',
                data: {
                    labels: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
                    datasets: [{
                        label: 'Affiliates',
                        data: [25, 34, 42, 18, 8],
                        backgroundColor: ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2', '#b9f2ff']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
    }

    // Modal functions
    showInviteModal() {
        document.getElementById('invite-modal').classList.remove('hidden');
        document.getElementById('invite-modal').classList.add('flex');
    }

    hideInviteModal() {
        document.getElementById('invite-modal').classList.add('hidden');
        document.getElementById('invite-modal').classList.remove('flex');
        document.getElementById('invite-form').reset();
    }

    // Affiliate management functions
    sendAffiliateInvitation() {
        const formData = {
            email: document.getElementById('invite-email').value,
            name: document.getElementById('invite-name').value,
            tier: document.getElementById('invite-tier').value,
            message: document.getElementById('invite-message').value
        };
        
        if (!formData.email) {
            this.showNotification('Please enter an email address', 'error');
            return;
        }
        
        this.showLoading(true);
        
        // Simulate sending invitation
        setTimeout(() => {
            this.hideInviteModal();
            this.showLoading(false);
            this.showNotification(`Invitation sent to ${formData.email} successfully!`, 'success');
            
            // Auto-send SMS notification to merchant
            setTimeout(() => {
                this.showNotification(`📱 SMS: New affiliate invitation sent to ${formData.name}`, 'info');
            }, 2000);
        }, 1500);
    }

    approveAffiliate(affiliateId) {
        const affiliate = this.adminData.affiliates.find(a => a.id === affiliateId);
        if (affiliate) {
            affiliate.status = 'active';
            this.loadAffiliatesData();
            this.showNotification(`${affiliate.name} has been approved and activated!`, 'success');
            
            // Send SMS notification
            setTimeout(() => {
                this.showNotification(`📱 SMS sent to ${affiliate.name}: "Welcome! Your affiliate application has been approved."`, 'info');
            }, 1000);
        }
    }

    approveApplication(email) {
        this.showLoading(true);
        setTimeout(() => {
            const app = this.adminData.recentApplications.find(a => a.email === email);
            if (app) {
                // Add to affiliates list
                const newAffiliate = {
                    id: this.adminData.affiliates.length + 1,
                    name: app.name,
                    email: app.email,
                    status: 'active',
                    tier: 'bronze',
                    sales: 0,
                    commission: 0,
                    joined: new Date().toISOString().split('T')[0],
                    avatar: `https://via.placeholder.com/40/3b82f6/ffffff?text=${app.name.split(' ').map(n => n[0]).join('')}`
                };
                
                this.adminData.affiliates.push(newAffiliate);
                
                // Remove from applications
                this.adminData.recentApplications = this.adminData.recentApplications.filter(a => a.email !== email);
                
                // Update counters
                this.adminData.store.total_affiliates++;
                this.adminData.store.active_affiliates++;
                this.adminData.store.pending_applications--;
                
                // Reload data
                this.loadAdminData();
                
                this.showLoading(false);
                this.showNotification(`${app.name} approved and added to your affiliate network!`, 'success');
                
                // Send welcome SMS
                setTimeout(() => {
                    this.showNotification(`📱 Welcome SMS sent to ${app.name}`, 'info');
                }, 1500);
            }
        }, 1000);
    }

    rejectApplication(email) {
        const app = this.adminData.recentApplications.find(a => a.email === email);
        if (app) {
            this.adminData.recentApplications = this.adminData.recentApplications.filter(a => a.email !== email);
            this.adminData.store.pending_applications--;
            this.loadRecentApplications();
            this.loadAdminData();
            this.showNotification(`Application from ${app.name} has been rejected`, 'info');
        }
    }

    messageAffiliate(affiliateId) {
        const affiliate = this.adminData.affiliates.find(a => a.id === affiliateId);
        if (affiliate) {
            // Would open message composer modal in real implementation
            this.showNotification(`Opening message composer for ${affiliate.name}...`, 'info');
        }
    }

    viewAffiliate(affiliateId) {
        const affiliate = this.adminData.affiliates.find(a => a.id === affiliateId);
        if (affiliate) {
            // Would open detailed affiliate profile in real implementation
            this.showNotification(`Viewing detailed profile for ${affiliate.name}...`, 'info');
        }
    }

    editAffiliate(affiliateId) {
        const affiliate = this.adminData.affiliates.find(a => a.id === affiliateId);
        if (affiliate) {
            // Would open edit form in real implementation
            this.showNotification(`Opening edit form for ${affiliate.name}...`, 'info');
        }
    }

    // Communication functions
    sendAnnouncement() {
        this.showNotification('Opening announcement composer...', 'info');
    }

    sendNewsletter() {
        this.showNotification('Opening newsletter template...', 'info');
    }

    sendPromotion() {
        this.showNotification('Creating promotion alert...', 'info');
    }

    sendTraining() {
        this.showNotification('Preparing training materials...', 'info');
    }

    // Recruitment functions
    sendBulkInvitations() {
        const emails = document.getElementById('bulk-emails').value;
        const emailList = emails.split('\\n').filter(email => email.trim());
        
        if (emailList.length === 0) {
            this.showNotification('Please enter at least one email address', 'error');
            return;
        }
        
        this.showLoading(true);
        
        setTimeout(() => {
            this.showLoading(false);
            this.showNotification(`Bulk invitations sent to ${emailList.length} potential affiliates!`, 'success');
            document.getElementById('bulk-emails').value = '';
        }, 2000);
    }

    copyApplicationUrl() {
        const url = 'https://yourstore.com/affiliates/apply';
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification('Application URL copied to clipboard!', 'success');
        });
    }

    updateApplicationPage() {
        this.showLoading(true);
        setTimeout(() => {
            this.showLoading(false);
            this.showNotification('Application page updated successfully!', 'success');
        }, 1000);
    }

    viewApplicationPage() {
        // Would open application page in new tab
        this.showNotification('Opening public application page...', 'info');
    }

    // Utility functions
    getTierColor(tier) {
        const colors = {
            bronze: 'bg-yellow-600 text-white',
            silver: 'bg-gray-400 text-white', 
            gold: 'bg-yellow-500 text-white',
            platinum: 'bg-gray-300 text-gray-800',
            diamond: 'bg-blue-200 text-blue-800'
        };
        return colors[tier] || 'bg-gray-100 text-gray-800';
    }

    getMessageTypeColor(type) {
        const colors = {
            question: 'bg-blue-100 text-blue-800',
            support: 'bg-green-100 text-green-800',
            system: 'bg-gray-100 text-gray-800',
            request: 'bg-purple-100 text-purple-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    }

    showAffiliateTab(tab) {
        // Update tab appearance
        document.querySelectorAll('.affiliate-tab').forEach(tabEl => {
            tabEl.classList.remove('border-blue-500', 'text-blue-600');
            tabEl.classList.add('border-transparent', 'text-gray-500');
        });
        
        event.target.classList.remove('border-transparent', 'text-gray-500');
        event.target.classList.add('border-blue-500', 'text-blue-600');
        
        // Filter affiliates based on tab
        // In real implementation, would filter the data
        this.showNotification(`Showing ${tab} affiliates`, 'info');
    }

    filterAffiliates() {
        this.showNotification('Applying affiliate filters...', 'info');
    }

    exportAffiliates() {
        this.showNotification('Exporting affiliate data to CSV...', 'success');
    }

    showNotifications() {
        const notifications = [
            'New affiliate application from Alex Thompson',
            '5 affiliates reached Gold tier this month', 
            'Sarah Wilson generated $2,400 in sales today',
            'Weekly commission payments processed: $4,567',
            'Monthly affiliate newsletter sent to 127 affiliates'
        ];
        
        alert('Recent Notifications:\\n\\n' + notifications.join('\\n'));
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
}

// Global functions for HTML onclick handlers
window.showSection = (section) => admin.showSection(section);
window.showInviteModal = () => admin.showInviteModal();
window.hideInviteModal = () => admin.hideInviteModal();
window.showNotifications = () => admin.showNotifications();

// Initialize the admin panel
const admin = new AffiliateBossAdmin();

console.log('🎉 Affiliate Boss Admin Panel loaded successfully!');