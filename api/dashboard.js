const { handleCors } = require('./utils/helpers');

// Dashboard HTML - clean and straightforward
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
        .glass { 
            background: rgba(255, 255, 255, 0.1); 
            backdrop-filter: blur(10px); 
        }
        .section { display: none; }
        .section.active { display: block; }
        .nav-item.active { background-color: rgb(31, 41, 55); }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <div class="flex h-screen">
        <!-- Sidebar -->
        <div class="w-64 bg-gray-800">
            <div class="p-6">
                <div class="flex items-center space-x-3 mb-8">
                    <i class="fas fa-rocket text-green-400 text-2xl"></i>
                    <h1 class="text-xl font-bold text-green-400">Affiliate Boss</h1>
                </div>
                
                <nav class="space-y-2">
                    <a href="#" onclick="showSection('overview')" class="nav-item active flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 block">
                        <i class="fas fa-chart-line"></i>
                        <span>Overview</span>
                    </a>
                    <a href="#" onclick="showSection('links')" class="nav-item flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 block">
                        <i class="fas fa-link"></i>
                        <span>My Links</span>
                    </a>
                    <a href="#" onclick="showSection('create')" class="nav-item flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 block">
                        <i class="fas fa-plus"></i>
                        <span>Create Link</span>
                    </a>
                    <a href="#" onclick="showSection('commissions')" class="nav-item flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 block">
                        <i class="fas fa-dollar-sign"></i>
                        <span>Commissions</span>
                    </a>
                    <a href="#" onclick="showSection('integrations')" class="nav-item flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 block">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Integrations</span>
                    </a>
                </nav>
                
                <div class="mt-8 pt-8 border-t border-gray-700">
                    <button onclick="logout()" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-600 w-full text-left">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 overflow-auto">
            <!-- Demo Banner -->
            <div class="bg-yellow-600 text-black p-4 flex items-center">
                <i class="fas fa-info-circle mr-3"></i>
                <span><strong>Demo Mode:</strong> You're viewing fake data. API Key: api_key_john_123456789</span>
            </div>

            <!-- Overview Section -->
            <div id="overview" class="section active p-8">
                <h2 class="text-3xl font-bold mb-8">Dashboard Overview</h2>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="glass p-6 rounded-lg border-2 border-green-400">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-400">Active Links</p>
                                <p class="text-2xl font-bold" id="totalLinks">24</p>
                            </div>
                            <i class="fas fa-link text-green-400 text-3xl"></i>
                        </div>
                    </div>
                    
                    <div class="glass p-6 rounded-lg border-2 border-green-400">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-400">Total Clicks</p>
                                <p class="text-2xl font-bold" id="totalClicks">15,847</p>
                            </div>
                            <i class="fas fa-mouse-pointer text-green-400 text-3xl"></i>
                        </div>
                    </div>
                    
                    <div class="glass p-6 rounded-lg border-2 border-green-400">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-400">Conversions</p>
                                <p class="text-2xl font-bold" id="totalConversions">387</p>
                            </div>
                            <i class="fas fa-chart-line text-green-400 text-3xl"></i>
                        </div>
                    </div>
                    
                    <div class="glass p-6 rounded-lg border-2 border-green-400">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-400">Total Earnings</p>
                                <p class="text-2xl font-bold" id="totalEarnings">$2,847.92</p>
                            </div>
                            <i class="fas fa-dollar-sign text-green-400 text-3xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="glass p-6 rounded-lg">
                        <h3 class="text-xl font-bold mb-4">Performance Chart</h3>
                        <canvas id="performanceChart"></canvas>
                    </div>
                    
                    <div class="glass p-6 rounded-lg">
                        <h3 class="text-xl font-bold mb-4">Top Performing Links</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center p-3 bg-gray-800 rounded">
                                <span>MacBook Pro M3 Max</span>
                                <span class="text-green-400 font-bold">$1,529.40</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-gray-800 rounded">
                                <span>Tesla Model S</span>
                                <span class="text-green-400 font-bold">$1,079.88</span>
                            </div>
                            <div class="flex justify-between items-center p-3 bg-gray-800 rounded">
                                <span>iPhone 15 Pro</span>
                                <span class="text-green-400 font-bold">$238.14</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Create Link Section -->
            <div id="create" class="section p-8">
                <h2 class="text-3xl font-bold mb-8">Create New Affiliate Link</h2>
                
                <div class="max-w-2xl">
                    <form id="createLinkForm" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">Original URL</label>
                            <input type="url" id="originalUrl" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none" placeholder="https://example.com/product" required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Link Name</label>
                            <input type="text" id="linkName" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none" placeholder="My Product Link" required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Description (Optional)</label>
                            <textarea id="linkDescription" rows="3" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none" placeholder="Brief description"></textarea>
                        </div>
                        
                        <button type="submit" class="bg-green-400 hover:bg-green-500 text-black px-8 py-3 rounded-lg font-semibold">
                            <i class="fas fa-plus mr-2"></i>Create Link
                        </button>
                    </form>
                </div>
            </div>

            <!-- Links Section -->
            <div id="links" class="section p-8">
                <h2 class="text-3xl font-bold mb-8">My Affiliate Links</h2>
                
                <div class="glass p-6 rounded-lg">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-gray-700">
                                    <th class="text-left py-3">Name</th>
                                    <th class="text-left py-3">Short URL</th>
                                    <th class="text-left py-3">Clicks</th>
                                    <th class="text-left py-3">Conversions</th>
                                    <th class="text-left py-3">Earnings</th>
                                    <th class="text-left py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="linksTable">
                                <tr>
                                    <td colspan="6" class="py-8 text-center text-gray-400">
                                        <i class="fas fa-spinner fa-spin mr-2"></i>Loading links...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Commissions Section -->
            <div id="commissions" class="section p-8">
                <h2 class="text-3xl font-bold mb-8">Commission History</h2>
                
                <div class="glass p-6 rounded-lg">
                    <div id="commissionsContent">
                        <div class="text-center py-8">
                            <i class="fas fa-spinner fa-spin mr-2"></i>Loading commissions...
                        </div>
                    </div>
                </div>
            </div>

            <!-- Integrations Section -->
            <div id="integrations" class="section p-8">
                <h2 class="text-3xl font-bold mb-8">Store Integrations</h2>
                
                <div class="glass p-6 rounded-lg">
                    <div id="integrationsContent">
                        <div class="text-center py-8">
                            <i class="fas fa-spinner fa-spin mr-2"></i>Loading integrations...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let authToken = localStorage.getItem('auth_token') || 'api_key_john_123456789';
        let currentSection = 'overview';

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Check if this is demo mode
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('demo') === 'true') {
                authToken = 'api_key_john_123456789';
                localStorage.setItem('auth_token', authToken);
            }

            setupChart();
            loadDashboardData();
        });

        // Navigation between sections
        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionName).classList.add('active');
            
            // Update nav active state
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');
            
            currentSection = sectionName;
            
            // Load data for the section
            loadSectionData(sectionName);
        }

        // Setup the performance chart
        function setupChart() {
            const ctx = document.getElementById('performanceChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Clicks',
                        data: [1200, 1900, 3000, 2500, 2200, 3000],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Conversions',
                        data: [30, 45, 75, 62, 55, 75],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { labels: { color: 'white' } }
                    },
                    scales: {
                        x: { ticks: { color: 'white' } },
                        y: { ticks: { color: 'white' } }
                    }
                }
            });
        }

        // Load dashboard overview data
        async function loadDashboardData() {
            try {
                const response = await fetch('/api/kpis/dashboard', {
                    headers: { 'X-API-Key': authToken }
                });
                const data = await response.json();
                
                if (data.success) {
                    updateStats(data.data);
                }
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        }

        // Update the stats display
        function updateStats(data) {
            document.getElementById('totalLinks').textContent = data.active_links || 24;
            document.getElementById('totalClicks').textContent = (data.total_clicks || 15847).toLocaleString();
            document.getElementById('totalConversions').textContent = (data.conversions || 387).toLocaleString();
            document.getElementById('totalEarnings').textContent = '$' + (data.total_commission || 2847.92).toLocaleString();
        }

        // Load data when switching sections
        async function loadSectionData(sectionName) {
            switch(sectionName) {
                case 'links':
                    await loadMyLinks();
                    break;
                case 'commissions':
                    await loadCommissions();
                    break;
                case 'integrations':
                    await loadIntegrations();
                    break;
            }
        }

        // Load user's affiliate links
        async function loadMyLinks() {
            try {
                const response = await fetch('/api/links', {
                    headers: { 'X-API-Key': authToken }
                });
                const data = await response.json();
                
                if (data.success) {
                    displayLinks(data.data);
                }
            } catch (error) {
                console.error('Error loading links:', error);
            }
        }

        // Display links in the table
        function displayLinks(links) {
            const tbody = document.getElementById('linksTable');
            
            if (!links || links.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-gray-400">No links found. Create your first link!</td></tr>';
                return;
            }
            
            tbody.innerHTML = links.map(link => 
                '<tr class="border-b border-gray-800">' +
                    '<td class="py-3">' + link.name + '</td>' +
                    '<td class="py-3">' +
                        '<a href="' + link.short_url + '" target="_blank" class="text-blue-400 hover:text-blue-300">' +
                            link.short_url +
                        '</a>' +
                    '</td>' +
                    '<td class="py-3">' + (link.clicks || 0).toLocaleString() + '</td>' +
                    '<td class="py-3">' + (link.conversions || 0) + '</td>' +
                    '<td class="py-3">$' + (link.earnings || 0).toFixed(2) + '</td>' +
                    '<td class="py-3">' +
                        '<button onclick="copyToClipboard(\'' + link.short_url + '\')" class="text-green-400 hover:text-green-300 mr-2">' +
                            '<i class="fas fa-copy"></i>' +
                        '</button>' +
                        '<button onclick="shareLink(\'' + link.short_url + '\')" class="text-blue-400 hover:text-blue-300">' +
                            '<i class="fas fa-share"></i>' +
                        '</button>' +
                    '</td>' +
                '</tr>'
            ).join('');
        }

        // Handle form submission for creating new links
        document.getElementById('createLinkForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                original_url: document.getElementById('originalUrl').value,
                name: document.getElementById('linkName').value,
                description: document.getElementById('linkDescription').value
            };
            
            try {
                const response = await fetch('/api/links', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': authToken
                    },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                
                if (data.success) {
                    alert('Link created successfully!');
                    document.getElementById('createLinkForm').reset();
                    showSection('links');
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Something went wrong. Please try again.');
            }
        });

        // Utility functions
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Link copied to clipboard!');
            });
        }

        function shareLink(url) {
            if (navigator.share) {
                navigator.share({
                    title: 'Check this out!',
                    url: url
                });
            } else {
                copyToClipboard(url);
            }
        }

        function logout() {
            localStorage.removeItem('auth_token');
            window.location.href = '/';
        }

        // Placeholder functions for other sections
        async function loadCommissions() {
            document.getElementById('commissionsContent').innerHTML = '<p class="text-center py-8">Commission history will load here...</p>';
        }

        async function loadIntegrations() {
            document.getElementById('integrationsContent').innerHTML = '<p class="text-center py-8">Store integrations will load here...</p>';
        }
    </script>
</body>
</html>
`;

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(dashboardHtml);
};