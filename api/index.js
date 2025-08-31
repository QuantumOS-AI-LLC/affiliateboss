const { handleCors } = require('./utils/helpers');

// Main landing page - keep it simple and clean
const landingPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Affiliate Boss - Affiliate Marketing Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .gradient-bg { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        }
        .neon-glow { 
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); 
        }
        .glass { 
            background: rgba(255, 255, 255, 0.1); 
            backdrop-filter: blur(10px); 
        }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <!-- Header -->
    <nav class="bg-gray-800 border-b-2 border-green-400">
        <div class="container mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <i class="fas fa-rocket text-green-400 text-2xl"></i>
                    <h1 class="text-2xl font-bold text-green-400">Affiliate Boss</h1>
                </div>
                <div class="flex space-x-4">
                    <button onclick="showLogin()" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
                        <i class="fas fa-sign-in-alt mr-2"></i>Login
                    </button>
                    <button onclick="showSignup()" class="bg-green-400 hover:bg-green-500 text-black px-6 py-2 rounded-lg">
                        <i class="fas fa-user-plus mr-2"></i>Sign Up
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="gradient-bg py-20">
        <div class="container mx-auto px-6 text-center">
            <h1 class="text-5xl font-bold mb-6">The Future of Affiliate Marketing</h1>
            <p class="text-xl mb-8 opacity-90">Create affiliate links, track performance, and earn commissions with ease.</p>
            <div class="flex justify-center space-x-6">
                <button onclick="tryDemo()" class="bg-green-400 hover:bg-green-500 text-black px-8 py-4 rounded-lg text-lg font-semibold neon-glow">
                    <i class="fas fa-play mr-2"></i>Try Demo
                </button>
                <button onclick="learnMore()" class="border-2 border-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold">
                    <i class="fas fa-info-circle mr-2"></i>Learn More
                </button>
            </div>
        </div>
    </div>

    <!-- Features -->
    <div id="features" class="py-20 bg-gray-800">
        <div class="container mx-auto px-6">
            <h2 class="text-4xl font-bold text-center mb-16">Why Choose Affiliate Boss?</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="glass p-8 rounded-lg border-2 border-green-400">
                    <i class="fas fa-link text-green-400 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-4">Quick Link Generation</h3>
                    <p>Turn any URL into a trackable affiliate link in seconds.</p>
                </div>
                <div class="glass p-8 rounded-lg border-2 border-green-400">
                    <i class="fas fa-chart-line text-green-400 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-4">Real-time Analytics</h3>
                    <p>Track clicks, conversions, and earnings with detailed reports.</p>
                </div>
                <div class="glass p-8 rounded-lg border-2 border-green-400">
                    <i class="fas fa-dollar-sign text-green-400 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-4">Commission Tracking</h3>
                    <p>Automated commission calculation and payout management.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Login Modal -->
    <div id="loginModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-green-400">Login</h2>
                <button onclick="closeModals()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <form id="loginForm">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Phone Number</label>
                    <input type="tel" id="loginPhone" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none" placeholder="+1234567890" required>
                </div>
                <button type="submit" class="w-full bg-green-400 hover:bg-green-500 text-black font-semibold py-3 rounded-lg">
                    <i class="fas fa-sms mr-2"></i>Send OTP
                </button>
            </form>
            <div id="otpSection" class="hidden mt-6">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Enter OTP Code</label>
                    <input type="text" id="otpCode" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none text-center text-2xl" placeholder="123456" maxlength="6" required>
                </div>
                <button onclick="verifyOtp()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
                    <i class="fas fa-check mr-2"></i>Verify & Login
                </button>
            </div>
        </div>
    </div>

    <!-- Signup Modal -->
    <div id="signupModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-green-400">Sign Up</h2>
                <button onclick="closeModals()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <form id="signupForm">
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <input type="text" id="firstName" class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none" placeholder="First Name" required>
                    <input type="text" id="lastName" class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none" placeholder="Last Name" required>
                </div>
                <div class="mb-4">
                    <input type="email" id="email" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none" placeholder="Email" required>
                </div>
                <div class="mb-4">
                    <input type="tel" id="phone" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none" placeholder="Phone (+1234567890)" required>
                </div>
                <div class="mb-4">
                    <input type="text" id="username" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:border-green-400 focus:outline-none" placeholder="Username" required>
                </div>
                <button type="submit" class="w-full bg-green-400 hover:bg-green-500 text-black font-semibold py-3 rounded-lg">
                    <i class="fas fa-rocket mr-2"></i>Create Account
                </button>
            </form>
        </div>
    </div>

    <script>
        // Simple modal functions
        function showLogin() {
            document.getElementById('loginModal').classList.remove('hidden');
            document.getElementById('signupModal').classList.add('hidden');
        }

        function showSignup() {
            document.getElementById('signupModal').classList.remove('hidden');
            document.getElementById('loginModal').classList.add('hidden');
        }

        function closeModals() {
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('signupModal').classList.add('hidden');
        }

        function learnMore() {
            document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
        }

        function tryDemo() {
            window.location.href = '/dashboard?demo=true';
        }

        // Handle login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('loginPhone').value;
            
            try {
                const response = await fetch('/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, type: 'login' })
                });
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('otpSection').classList.remove('hidden');
                    alert('OTP sent to your phone!');
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Something went wrong. Please try again.');
            }
        });

        // Handle signup form
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                first_name: document.getElementById('firstName').value,
                last_name: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                username: document.getElementById('username').value
            };
            
            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                
                if (data.success) {
                    alert('Account created! Please check your phone for verification.');
                    showLogin();
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Something went wrong. Please try again.');
            }
        });

        // Handle OTP verification
        async function verifyOtp() {
            const phone = document.getElementById('loginPhone').value;
            const code = document.getElementById('otpCode').value;
            
            try {
                const response = await fetch('/api/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, code })
                });
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('auth_token', data.token);
                    window.location.href = '/dashboard';
                } else {
                    alert('Invalid OTP. Please try again.');
                }
            } catch (error) {
                alert('Something went wrong. Please try again.');
            }
        }
    </script>
</body>
</html>
`;

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(landingPageHtml);
};