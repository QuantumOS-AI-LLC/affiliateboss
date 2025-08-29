// Dashboard route for Vercel
import { handleCORS } from './_utils.js'

export default function handler(req, res) {
  if (handleCORS(req, res)) return

  const html = `
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
          .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); }
          .neon { color: #00ff88; }
          .neon-border { border-color: #00ff88; }
        </style>
    </head>
    <body class="bg-gray-900 text-white min-h-screen">
        <!-- Sidebar -->
        <div class="flex">
            <div class="w-64 bg-gray-800 min-h-screen p-6">
                <div class="flex items-center space-x-3 mb-8">
                    <i class="fas fa-rocket text-2xl neon"></i>
                    <h1 class="text-xl font-bold neon">Affiliate Boss</h1>
                </div>
                <nav class="space-y-4">
                    <a href="#" onclick="showSection('overview', this)" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item active">
                        <i class="fas fa-chart-line"></i>
                        <span>Overview</span>
                    </a>
                    <a href="#" onclick="showSection('links', this)" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-link"></i>
                        <span>My Links</span>
                    </a>
                    <a href="#" onclick="showSection('create', this)" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-plus"></i>
                        <span>Create Link</span>
                    </a>
                    <a href="#" onclick="showSection('commissions', this)" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span>Commissions</span>
                    </a>
                    <a href="#" onclick="showSection('payments', this)" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-credit-card"></i>
                        <span>Payments</span>
                    </a>
                    <a href="#" onclick="showSection('integrations', this)" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Store Integrations</span>
                    </a>
                    <a href="#" onclick="showSection('commission-profiles', this)" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-percentage"></i>
                        <span>Commission Rules</span>
                    </a>
                    <a href="#" onclick="showSection('profile', this)" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors nav-item">
                        <i class="fas fa-user"></i>
                        <span>Profile</span>
                    </a>
                </nav>
                <div class="mt-8 pt-8 border-t border-gray-700">
                    <button onclick="logout()" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-600 transition-colors w-full">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 p-8">
                <!-- Demo Mode Banner -->
                <div class="bg-yellow-600 text-black p-4 rounded-lg mb-6 flex items-center">
                    <i class="fas fa-info-circle mr-3"></i>
                    <span><strong>Demo Mode:</strong> You are viewing a demonstration with fake data. API Key: api_key_john_123456789</span>
                </div>

                <!-- Overview Section -->
                <div id="overview-section" class="section active">
                    <h2 class="text-3xl font-bold mb-8">Dashboard Overview</h2>
                    
                    <!-- Stats Cards -->
                    <div class="grid md:grid-cols-4 gap-6 mb-8">
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Total Links</p>
                                    <p class="text-2xl font-bold" id="totalLinks">24</p>
                                </div>
                                <i class="fas fa-link text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Total Clicks</p>
                                    <p class="text-2xl font-bold" id="totalClicks">15,847</p>
                                </div>
                                <i class="fas fa-mouse-pointer text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Conversions</p>
                                    <p class="text-2xl font-bold" id="totalConversions">387</p>
                                </div>
                                <i class="fas fa-chart-line text-3xl neon"></i>
                            </div>
                        </div>
                        <div class="glass p-6 rounded-lg neon-border">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-400">Total Earnings</p>
                                    <p class="text-2xl font-bold" id="totalEarnings">$2,847.92</p>
                                </div>
                                <i class="fas fa-dollar-sign text-3xl neon"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Charts -->
                    <div class="grid md:grid-cols-2 gap-6 mb-8">
                        <div class="glass p-6 rounded-lg">
                            <h3 class="text-xl font-bold mb-4">Performance Chart</h3>
                            <canvas id="performanceChart" width="400" height="200"></canvas>
                        </div>
                        <div class="glass p-6 rounded-lg">
                            <h3 class="text-xl font-bold mb-4">Top Performing Links</h3>
                            <div class="space-y-4" id="topLinks">
                                <div class="flex justify-between items-center p-3 bg-gray-800 rounded">
                                    <span>MacBook Pro M3 Max</span>
                                    <span class="neon">$1,529.40</span>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-gray-800 rounded">
                                    <span>Tesla Model S Plaid</span>
                                    <span class="neon">$1,079.88</span>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-gray-800 rounded">
                                    <span>iPhone 15 Pro Max</span>
                                    <span class="neon">$238.14</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Create Link Section -->
                <div id="create-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Create Affiliate Link</h2>
                    <div class="max-w-2xl">
                        <form id="createLinkForm" class="space-y-6">
                            <div>
                                <label class="block text-sm font-medium mb-2">Original URL</label>
                                <input type="url" id="originalUrl" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-neon focus:outline-none" placeholder="https://example.com/product" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Link Name</label>
                                <input type="text" id="linkName" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-neon focus:outline-none" placeholder="My Product Link" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Description (Optional)</label>
                                <textarea id="linkDescription" rows="3" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-neon focus:outline-none" placeholder="Brief description of this link"></textarea>
                            </div>
                            <button type="submit" class="bg-neon hover:bg-green-400 text-black px-8 py-3 rounded-lg font-semibold">
                                <i class="fas fa-plus mr-2"></i>Create Link
                            </button>
                        </form>
                    </div>
                </div>

                <!-- My Links Section -->
                <div id="links-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">My Affiliate Links</h2>
                    <div class="glass p-6 rounded-lg">
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b border-gray-700">
                                        <th class="text-left py-3">Link Name</th>
                                        <th class="text-left py-3">Short URL</th>
                                        <th class="text-left py-3">Clicks</th>
                                        <th class="text-left py-3">Conversions</th>
                                        <th class="text-left py-3">Earnings</th>
                                        <th class="text-left py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="linksTable">
                                    <tr class="border-b border-gray-800">
                                        <td colspan="6" class="py-8 text-center text-gray-400">
                                            <i class="fas fa-spinner fa-spin mr-2"></i>Loading links...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Other sections would go here... -->
                <div id="commissions-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Commission History</h2>
                    <div class="glass p-6 rounded-lg">
                        <div class="space-y-4" id="commissionsHistory">
                            <div class="flex justify-center py-8">
                                <i class="fas fa-spinner fa-spin mr-2"></i>Loading commission history...
                            </div>
                        </div>
                    </div>
                </div>

                <div id="payments-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Payments</h2>
                    <div class="glass p-6 rounded-lg">
                        <p class="text-center text-gray-400 py-8">Payment history will be displayed here.</p>
                    </div>
                </div>

                <div id="integrations-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Store Integrations</h2>
                    <div class="glass p-6 rounded-lg">
                        <div id="integrationsContent">
                            <div class="flex justify-center py-8">
                                <i class="fas fa-spinner fa-spin mr-2"></i>Loading integrations...
                            </div>
                        </div>
                    </div>
                </div>

                <div id="commission-profiles-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Commission Rules</h2>
                    <div class="glass p-6 rounded-lg">
                        <p class="text-center text-gray-400 py-8">Commission rules will be displayed here.</p>
                    </div>
                </div>

                <div id="profile-section" class="section hidden">
                    <h2 class="text-3xl font-bold mb-8">Profile Settings</h2>
                    <div class="glass p-6 rounded-lg">
                        <div id="profileContent">
                            <div class="flex justify-center py-8">
                                <i class="fas fa-spinner fa-spin mr-2"></i>Loading profile...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Global variables
            let authToken = localStorage.getItem('auth_token') || 'api_key_john_123456789'
            let currentSection = 'overview'

            // Initialize dashboard
            document.addEventListener('DOMContentLoaded', function() {
                // Check demo mode
                const urlParams = new URLSearchParams(window.location.search)
                if (urlParams.get('demo') === 'true') {
                    authToken = 'api_key_john_123456789'
                    localStorage.setItem('auth_token', authToken)
                }

                initializeCharts()
                loadDashboardData()
            })

            // Navigation
            function showSection(sectionId, element) {
                // Hide all sections
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.add('hidden')
                    section.classList.remove('active')
                })
                
                // Show selected section
                const section = document.getElementById(sectionId + '-section')
                if (section) {
                    section.classList.remove('hidden')
                    section.classList.add('active')
                }
                
                // Update navigation
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active')
                })
                element.classList.add('active')
                
                currentSection = sectionId
                
                // Load section-specific data
                loadSectionData(sectionId)
            }

            // Initialize charts
            function initializeCharts() {
                const ctx = document.getElementById('performanceChart').getContext('2d')
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Clicks',
                            data: [1200, 1900, 3000, 2500, 2200, 3000],
                            borderColor: '#00ff88',
                            backgroundColor: 'rgba(0, 255, 136, 0.1)',
                            tension: 0.4
                        }, {
                            label: 'Conversions',
                            data: [30, 45, 75, 62, 55, 75],
                            borderColor: '#0066ff',
                            backgroundColor: 'rgba(0, 102, 255, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                labels: { color: 'white' }
                            }
                        },
                        scales: {
                            x: { ticks: { color: 'white' } },
                            y: { ticks: { color: 'white' } }
                        }
                    }
                })
            }

            // Load dashboard data
            async function loadDashboardData() {
                try {
                    const response = await fetch('/api/kpis/dashboard', {
                        headers: { 'X-API-Key': authToken }
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                        updateDashboardStats(data.data)
                    }
                } catch (error) {
                    console.error('Error loading dashboard:', error)
                }
            }

            // Update dashboard stats
            function updateDashboardStats(data) {
                document.getElementById('totalLinks').textContent = data.active_links || 24
                document.getElementById('totalClicks').textContent = (data.total_clicks || 15847).toLocaleString()
                document.getElementById('totalConversions').textContent = (data.conversions || 387).toLocaleString()
                document.getElementById('totalEarnings').textContent = '$' + (data.total_commission || 2847.92).toLocaleString()
            }

            // Load section-specific data
            async function loadSectionData(sectionId) {
                switch(sectionId) {
                    case 'links':
                        await loadMyLinks()
                        break
                    case 'commissions':
                        await loadCommissions()
                        break
                    case 'integrations':
                        await loadIntegrations()
                        break
                    case 'profile':
                        await loadProfile()
                        break
                }
            }

            // Load my links
            async function loadMyLinks() {
                try {
                    const response = await fetch('/api/links', {
                        headers: { 'X-API-Key': authToken }
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                        displayLinks(data.data)
                    }
                } catch (error) {
                    console.error('Error loading links:', error)
                }
            }

            // Display links in table
            function displayLinks(links) {
                const tbody = document.getElementById('linksTable')
                if (!links || links.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-gray-400">No links found. Create your first link!</td></tr>'
                    return
                }
                
                tbody.innerHTML = links.map(link => \`
                    <tr class="border-b border-gray-800">
                        <td class="py-3">\${link.name}</td>
                        <td class="py-3">
                            <a href="\${link.short_url}" target="_blank" class="text-blue-400 hover:text-blue-300">
                                \${link.short_url}
                            </a>
                        </td>
                        <td class="py-3">\${(link.clicks || 0).toLocaleString()}</td>
                        <td class="py-3">\${link.conversions || 0}</td>
                        <td class="py-3">$\${(link.earnings || 0).toFixed(2)}</td>
                        <td class="py-3">
                            <button onclick="copyLink('\${link.short_url}')" class="text-neon hover:text-green-400 mr-2">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button onclick="shareLink('\${link.short_url}')" class="text-blue-400 hover:text-blue-300">
                                <i class="fas fa-share"></i>
                            </button>
                        </td>
                    </tr>
                \`).join('')
            }

            // Create new link
            document.getElementById('createLinkForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const formData = {
                    original_url: document.getElementById('originalUrl').value,
                    name: document.getElementById('linkName').value,
                    description: document.getElementById('linkDescription').value
                }
                
                try {
                    const response = await fetch('/api/links', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': authToken
                        },
                        body: JSON.stringify(formData)
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                        alert('Link created successfully!')
                        document.getElementById('createLinkForm').reset()
                        showSection('links', document.querySelector('[onclick*="links"]'))
                    } else {
                        alert('Error: ' + data.error)
                    }
                } catch (error) {
                    alert('Network error. Please try again.')
                }
            })

            // Utility functions
            function copyLink(url) {
                navigator.clipboard.writeText(url).then(() => {
                    alert('Link copied to clipboard!')
                })
            }

            function shareLink(url) {
                if (navigator.share) {
                    navigator.share({
                        title: 'Check out this product!',
                        url: url
                    })
                } else {
                    copyLink(url)
                }
            }

            function logout() {
                localStorage.removeItem('auth_token')
                window.location.href = '/'
            }

            // Load other sections (placeholder functions)
            async function loadCommissions() {
                // Will be implemented with API call
                document.getElementById('commissionsHistory').innerHTML = '<p class="text-center text-gray-400 py-8">Commission history loaded from API...</p>'
            }

            async function loadIntegrations() {
                // Will be implemented with API call  
                document.getElementById('integrationsContent').innerHTML = '<p class="text-center text-gray-400 py-8">Store integrations loaded from API...</p>'
            }

            async function loadProfile() {
                // Will be implemented with API call
                document.getElementById('profileContent').innerHTML = '<p class="text-center text-gray-400 py-8">Profile data loaded from API...</p>'
            }
        </script>
    </body>
    </html>
  `

  res.status(200).send(html)
}