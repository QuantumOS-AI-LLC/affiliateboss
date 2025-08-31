const { handleCors } = require('./utils/helpers');

// Full comprehensive dashboard - like a 5-year Bangladesh dev would build it
const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Affiliate Boss</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .glass-effect { 
            background: rgba(255, 255, 255, 0.1); 
            backdrop-filter: blur(10px); 
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .section-content { display: none; }
        .section-content.active { display: block; }
        .nav-item.active { 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-connected { background: #10b981; color: white; }
        .status-pending { background: #f59e0b; color: white; }
        .status-failed { background: #ef4444; color: white; }
        .commission-tier {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
        }
        .metric-card {
            transition: all 0.3s ease;
        }
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body class="bg-gray-900 text-white font-sans">
    <div class="flex h-screen overflow-hidden">
        <!-- Enhanced Sidebar -->
        <div class="w-72 bg-gray-800 shadow-2xl">
            <div class="p-6">
                <div class="flex items-center space-x-3 mb-8">
                    <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <i class="fas fa-rocket text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-green-400">Affiliate Boss</h1>
                        <p class="text-xs text-gray-400">Pro Dashboard</p>
                    </div>
                </div>
                
                <!-- User Profile Section -->
                <div class="glass-effect p-4 rounded-lg mb-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span class="text-white font-bold">JD</span>
                        </div>
                        <div>
                            <p class="font-semibold">John Demo</p>
                            <p class="text-xs text-green-400">Premium Tier</p>
                        </div>
                    </div>
                    <div class="mt-3 text-xs text-gray-300">
                        <div class="flex justify-between">
                            <span>Monthly Earnings:</span>
                            <span class="text-green-400 font-bold">$2,847.92</span>
                        </div>
                    </div>
                </div>
                
                <!-- Navigation Menu -->
                <nav class="space-y-1">
                    <button onclick="showSection('dashboard')" class="nav-item active w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 text-left transition-all">
                        <i class="fas fa-chart-pie w-5"></i>
                        <span>Dashboard</span>
                    </button>
                    <button onclick="showSection('links')" class="nav-item w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 text-left transition-all">
                        <i class="fas fa-link w-5"></i>
                        <span>Affiliate Links</span>
                        <span class="ml-auto bg-gray-600 text-xs px-2 py-1 rounded-full">24</span>
                    </button>
                    <button onclick="showSection('products')" class="nav-item w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 text-left transition-all">
                        <i class="fas fa-cube w-5"></i>
                        <span>Products</span>
                        <span class="ml-auto bg-gray-600 text-xs px-2 py-1 rounded-full">12</span>
                    </button>
                    <button onclick="showSection('shopify')" class="nav-item w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 text-left transition-all">
                        <i class="fab fa-shopify w-5"></i>
                        <span>Shopify Stores</span>
                        <span class="ml-auto bg-green-500 text-xs px-2 py-1 rounded-full">2</span>
                    </button>
                    <button onclick="showSection('commissions')" class="nav-item w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 text-left transition-all">
                        <i class="fas fa-dollar-sign w-5"></i>
                        <span>Commissions</span>
                    </button>
                    <button onclick="showSection('analytics')" class="nav-item w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 text-left transition-all">
                        <i class="fas fa-chart-line w-5"></i>
                        <span>Analytics</span>
                    </button>
                    <button onclick="showSection('payouts')" class="nav-item w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 text-left transition-all">
                        <i class="fas fa-credit-card w-5"></i>
                        <span>Payouts</span>
                    </button>
                    <button onclick="showSection('settings')" class="nav-item w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 text-left transition-all">
                        <i class="fas fa-cog w-5"></i>
                        <span>Settings</span>
                    </button>
                </nav>
                
                <!-- Quick Stats -->
                <div class="mt-6 pt-6 border-t border-gray-700">
                    <div class="grid grid-cols-2 gap-2 text-center">
                        <div class="glass-effect p-2 rounded">
                            <div class="text-green-400 font-bold text-sm">387</div>
                            <div class="text-xs text-gray-400">Conversions</div>
                        </div>
                        <div class="glass-effect p-2 rounded">
                            <div class="text-blue-400 font-bold text-sm">2.44%</div>
                            <div class="text-xs text-gray-400">CVR</div>
                        </div>
                    </div>
                </div>
                
                <!-- Logout -->
                <div class="mt-8 pt-4 border-t border-gray-700">
                    <button onclick="logout()" class="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-600 text-left transition-all">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1 overflow-auto">
            <!-- Top Header -->
            <header class="bg-gray-800 border-b border-gray-700 px-8 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-white" id="pageTitle">Dashboard Overview</h1>
                        <p class="text-gray-400 text-sm" id="pageSubtitle">Real-time affiliate performance metrics</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <!-- Demo Mode Badge -->
                        <div class="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                            <i class="fas fa-flask mr-1"></i>DEMO MODE
                        </div>
                        <!-- Notifications -->
                        <div class="relative">
                            <button class="p-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                                <i class="fas fa-bell"></i>
                            </button>
                            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">3</span>
                        </div>
                        <!-- API Key Display -->
                        <div class="bg-gray-700 px-3 py-1 rounded-lg text-sm">
                            <span class="text-gray-400">API:</span>
                            <code class="text-green-400 ml-1">api_key_john_123456789</code>
                            <button onclick="copyApiKey()" class="ml-2 text-gray-400 hover:text-white">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Content Sections -->
            <main class="p-8">
                <!-- Dashboard Overview Section -->
                <div id="dashboard-content" class="section-content active">
                    <!-- KPI Cards Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <!-- Total Revenue Card -->
                        <div class="metric-card glass-effect p-6 rounded-xl">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-dollar-sign text-white text-xl"></i>
                                </div>
                                <div class="text-right">
                                    <div class="text-green-400 text-xs font-semibold">+12.5%</div>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-gray-400 text-sm font-medium">Total Revenue</h3>
                                <p class="text-3xl font-bold text-white" id="totalRevenue">$2,847.92</p>
                                <p class="text-gray-400 text-xs mt-1">This month</p>
                            </div>
                        </div>

                        <!-- Total Clicks Card -->
                        <div class="metric-card glass-effect p-6 rounded-xl">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-mouse-pointer text-white text-xl"></i>
                                </div>
                                <div class="text-right">
                                    <div class="text-blue-400 text-xs font-semibold">+8.2%</div>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-gray-400 text-sm font-medium">Total Clicks</h3>
                                <p class="text-3xl font-bold text-white" id="totalClicks">15,847</p>
                                <p class="text-gray-400 text-xs mt-1">All time</p>
                            </div>
                        </div>

                        <!-- Conversions Card -->
                        <div class="metric-card glass-effect p-6 rounded-xl">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-chart-line text-white text-xl"></i>
                                </div>
                                <div class="text-right">
                                    <div class="text-purple-400 text-xs font-semibold">+15.7%</div>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-gray-400 text-sm font-medium">Conversions</h3>
                                <p class="text-3xl font-bold text-white" id="totalConversions">387</p>
                                <p class="text-gray-400 text-xs mt-1">2.44% rate</p>
                            </div>
                        </div>

                        <!-- Active Links Card -->
                        <div class="metric-card glass-effect p-6 rounded-xl">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-link text-white text-xl"></i>
                                </div>
                                <div class="text-right">
                                    <div class="text-orange-400 text-xs font-semibold">+2</div>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-gray-400 text-sm font-medium">Active Links</h3>
                                <p class="text-3xl font-bold text-white" id="activeLinks">24</p>
                                <p class="text-gray-400 text-xs mt-1">2 inactive</p>
                            </div>
                        </div>
                    </div>

                    <!-- Charts and Analytics Row -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <!-- Performance Chart -->
                        <div class="glass-effect p-6 rounded-xl">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-xl font-bold">Performance Trends</h3>
                                <div class="flex space-x-2">
                                    <button class="px-3 py-1 bg-green-600 rounded text-sm">7D</button>
                                    <button class="px-3 py-1 bg-gray-600 rounded text-sm">30D</button>
                                    <button class="px-3 py-1 bg-gray-600 rounded text-sm">90D</button>
                                </div>
                            </div>
                            <canvas id="performanceChart" height="250"></canvas>
                        </div>

                        <!-- Top Products -->
                        <div class="glass-effect p-6 rounded-xl">
                            <h3 class="text-xl font-bold mb-6">Top Performing Products</h3>
                            <div class="space-y-4" id="topProducts">
                                <div class="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                                    <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=50&h=50&fit=crop" class="w-12 h-12 rounded-lg">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-sm">MacBook Pro M3 Max</h4>
                                        <p class="text-xs text-gray-400">45 conversions</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-green-400 font-bold">$1,529.40</div>
                                        <div class="text-xs text-gray-400">8.5% rate</div>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                                    <img src="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=50&h=50&fit=crop" class="w-12 h-12 rounded-lg">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-sm">Tesla Model S Plaid</h4>
                                        <p class="text-xs text-gray-400">9 conversions</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-green-400 font-bold">$1,079.88</div>
                                        <div class="text-xs text-gray-400">12% rate</div>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                                    <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=50&h=50&fit=crop" class="w-12 h-12 rounded-lg">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-sm">iPhone 15 Pro Max</h4>
                                        <p class="text-xs text-gray-400">31 conversions</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-green-400 font-bold">$238.14</div>
                                        <div class="text-xs text-gray-400">6.5% rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity and Geographic Stats -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Recent Activity -->
                        <div class="glass-effect p-6 rounded-xl">
                            <h3 class="text-xl font-bold mb-6">Recent Activity</h3>
                            <div class="space-y-4" id="recentActivity">
                                <div class="flex items-center space-x-4 p-3 border-l-4 border-green-500 bg-gray-800 rounded">
                                    <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                        <i class="fas fa-dollar-sign text-white text-sm"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-semibold text-sm">MacBook Pro sale completed</p>
                                        <p class="text-xs text-gray-400">Commission: $339.92 • 2 hours ago</p>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-4 p-3 border-l-4 border-blue-500 bg-gray-800 rounded">
                                    <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <i class="fas fa-mouse-pointer text-white text-sm"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-semibold text-sm">iPhone 15 Pro link clicked</p>
                                        <p class="text-xs text-gray-400">From Canada • 3 hours ago</p>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-4 p-3 border-l-4 border-purple-500 bg-gray-800 rounded">
                                    <div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                        <i class="fas fa-credit-card text-white text-sm"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-semibold text-sm">Weekly payout processed</p>
                                        <p class="text-xs text-gray-400">Amount: $734.21 • 1 day ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Geographic Performance -->
                        <div class="glass-effect p-6 rounded-xl">
                            <h3 class="text-xl font-bold mb-6">Geographic Performance</h3>
                            <div class="space-y-3" id="geographicStats">
                                <div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-xl">🇺🇸</span>
                                        <span class="font-medium">United States</span>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-green-400 font-bold">$1,547.83</div>
                                        <div class="text-xs text-gray-400">8,234 clicks</div>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-xl">🇨🇦</span>
                                        <span class="font-medium">Canada</span>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-green-400 font-bold">$634.21</div>
                                        <div class="text-xs text-gray-400">2,456 clicks</div>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-xl">🇬🇧</span>
                                        <span class="font-medium">United Kingdom</span>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-green-400 font-bold">$421.67</div>
                                        <div class="text-xs text-gray-400">1,987 clicks</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Other sections will be loaded dynamically -->
                <div id="links-content" class="section-content">
                    <div class="text-center py-12">
                        <i class="fas fa-link text-6xl text-gray-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Affiliate Links Management</h3>
                        <p class="text-gray-400">Loading comprehensive link management interface...</p>
                    </div>
                </div>

                <div id="products-content" class="section-content">
                    <div class="text-center py-12">
                        <i class="fas fa-cube text-6xl text-gray-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Product Catalog</h3>
                        <p class="text-gray-400">Loading product management system...</p>
                    </div>
                </div>

                <div id="shopify-content" class="section-content">
                    <div class="text-center py-12">
                        <i class="fab fa-shopify text-6xl text-gray-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Shopify Integration</h3>
                        <p class="text-gray-400">Loading Shopify store management...</p>
                    </div>
                </div>

                <div id="commissions-content" class="section-content">
                    <div class="text-center py-12">
                        <i class="fas fa-dollar-sign text-6xl text-gray-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Commission Tracking</h3>
                        <p class="text-gray-400">Loading advanced commission system...</p>
                    </div>
                </div>

                <div id="analytics-content" class="section-content">
                    <div class="text-center py-12">
                        <i class="fas fa-chart-line text-6xl text-gray-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Advanced Analytics</h3>
                        <p class="text-gray-400">Loading comprehensive analytics dashboard...</p>
                    </div>
                </div>

                <div id="payouts-content" class="section-content">
                    <div class="text-center py-12">
                        <i class="fas fa-credit-card text-6xl text-gray-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Payout Management</h3>
                        <p class="text-gray-400">Loading Stripe and PayPal integration...</p>
                    </div>
                </div>

                <div id="settings-content" class="section-content">
                    <div class="text-center py-12">
                        <i class="fas fa-cog text-6xl text-gray-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Account Settings</h3>
                        <p class="text-gray-400">Loading user preferences and configuration...</p>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script>
        // Global state management
        let currentUser = {
            id: 1,
            name: 'John Demo',
            email: 'john.demo@affiliateboss.com',
            tier: 'premium',
            apiKey: 'api_key_john_123456789'
        };

        let dashboardData = {};
        
        // Initialize dashboard when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initializeDashboard();
            loadDashboardMetrics();
            setupCharts();
        });

        // Navigation system
        function showSection(sectionName) {
            // Update page title and subtitle
            const titles = {
                'dashboard': ['Dashboard Overview', 'Real-time affiliate performance metrics'],
                'links': ['Affiliate Links', 'Manage and track your affiliate links'],
                'products': ['Product Catalog', 'Browse and manage available products'],
                'shopify': ['Shopify Integration', 'Connect and sync your Shopify stores'],
                'commissions': ['Commission Tracking', 'View earnings and commission history'],
                'analytics': ['Advanced Analytics', 'Detailed performance insights'],
                'payouts': ['Payout Management', 'Configure payments and withdrawals'],
                'settings': ['Account Settings', 'Manage your account preferences']
            };

            const [title, subtitle] = titles[sectionName] || ['Dashboard', 'Affiliate Boss'];
            document.getElementById('pageTitle').textContent = title;
            document.getElementById('pageSubtitle').textContent = subtitle;

            // Hide all content sections
            document.querySelectorAll('.section-content').forEach(section => {
                section.classList.remove('active');
            });

            // Show selected section
            const targetSection = document.getElementById(sectionName + '-content');
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Update navigation active state
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');

            // Load section-specific data
            loadSectionData(sectionName);
        }

        // Initialize dashboard metrics
        function initializeDashboard() {
            console.log('🚀 Initializing Affiliate Boss Dashboard');
            
            // Set demo mode indicators
            if (window.location.search.includes('demo=true')) {
                localStorage.setItem('demo_mode', 'true');
            }
        }

        // Load dashboard metrics from API
        async function loadDashboardMetrics() {
            try {
                const response = await fetch('/api/kpis/dashboard', {
                    headers: {
                        'X-API-Key': currentUser.apiKey
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        updateDashboardUI(data.data);
                    }
                } else {
                    console.warn('Failed to load dashboard metrics');
                    // Use fallback data for demo
                    updateDashboardUI({
                        total_commission: 2847.92,
                        total_clicks: 15847,
                        conversions: 387,
                        active_links: 24
                    });
                }
            } catch (error) {
                console.error('Error loading dashboard metrics:', error);
            }
        }

        // Update UI with dashboard data
        function updateDashboardUI(data) {
            // Update metric cards
            document.getElementById('totalRevenue').textContent = '$' + (data.total_commission || 2847.92).toLocaleString();
            document.getElementById('totalClicks').textContent = (data.total_clicks || 15847).toLocaleString();
            document.getElementById('totalConversions').textContent = (data.conversions || 387).toLocaleString();
            document.getElementById('activeLinks').textContent = (data.active_links || 24).toString();

            console.log('✅ Dashboard metrics updated');
        }

        // Setup performance charts
        function setupCharts() {
            const ctx = document.getElementById('performanceChart').getContext('2d');
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'Clicks',
                            data: [1200, 1900, 3000, 2500, 2200, 3000, 2800],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Conversions',
                            data: [30, 45, 75, 62, 55, 75, 68],
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Revenue ($)',
                            data: [450, 680, 1125, 930, 825, 1125, 1020],
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: 'white' }
                        }
                    },
                    scales: {
                        x: { 
                            ticks: { color: 'white' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: { 
                            ticks: { color: 'white' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }

        // Load section-specific data
        async function loadSectionData(sectionName) {
            console.log('📊 Loading data for section:', sectionName);
            
            switch(sectionName) {
                case 'links':
                    await loadAffiliateLinks();
                    break;
                case 'products':
                    await loadProducts();
                    break;
                case 'shopify':
                    await loadShopifyStores();
                    break;
                case 'commissions':
                    await loadCommissions();
                    break;
                case 'analytics':
                    await loadAnalytics();
                    break;
                case 'payouts':
                    await loadPayouts();
                    break;
                case 'settings':
                    await loadSettings();
                    break;
            }
        }

        // Placeholder functions for section loading
        async function loadAffiliateLinks() {
            console.log('🔗 Loading affiliate links...');
        }

        async function loadProducts() {
            console.log('📦 Loading products...');
        }

        async function loadShopifyStores() {
            console.log('🛍️ Loading Shopify stores...');
        }

        async function loadCommissions() {
            console.log('💰 Loading commission data...');
        }

        async function loadAnalytics() {
            console.log('📈 Loading analytics...');
        }

        async function loadPayouts() {
            console.log('💳 Loading payout information...');
        }

        async function loadSettings() {
            console.log('⚙️ Loading settings...');
        }

        // Utility functions
        function copyApiKey() {
            const apiKey = currentUser.apiKey;
            navigator.clipboard.writeText(apiKey).then(() => {
                // Show success feedback
                const button = event.target;
                const originalIcon = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.classList.add('text-green-400');
                
                setTimeout(() => {
                    button.innerHTML = originalIcon;
                    button.classList.remove('text-green-400');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy API key:', err);
            });
        }

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('demo_mode');
                window.location.href = '/';
            }
        }

        // Auto-refresh dashboard data every 30 seconds
        setInterval(() => {
            if (document.getElementById('dashboard-content').classList.contains('active')) {
                loadDashboardMetrics();
            }
        }, 30000);
    </script>
</body>
</html>
`;

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(dashboardHtml);
};