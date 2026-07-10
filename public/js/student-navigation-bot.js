/**
 * Simple Navigation Chatbot for Student Dashboard
 * Frontend-only, no backend calls, pure routing
 */

class StudentNavigationBot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        
        // Check if user is authenticated (student only)
        if (!this.checkAuthentication()) {
            return; // Don't initialize if not logged in
        }
        
        // Navigation routes mapping
        this.routes = {
            'profile': '/profile.html',
            'attendance': '/attendance.html',
            'results': '/results.html',
            'marks': '/results.html',
            'grades': '/results.html',
            'timetable': '/timetable.html',
            'schedule': '/timetable.html',
            'fees': '/fees.html',
            'assignments': '/assignments.html',
            'homework': '/assignments.html',
            'notices': '/notices.html',
            'announcements': '/notices.html',
            'forgot password': '/change_password.html',
            'reset password': '/change_password.html',
            'change password': '/change_password.html',
            'password': '/change_password.html',
            'dashboard': '/student/student_dashboard.html',
            'home': '/student/student_dashboard.html'
        };
        
        this.init();
    }
    
    /**
     * Check if user is authenticated (student)
     */
    checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Only show for students
            return payload.role === 'student';
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Initialize chatbot
     */
    init() {
        this.createChatbotHTML();
        this.attachEventListeners();
        this.addWelcomeMessage();
    }
    
    /**
     * Create chatbot HTML
     */
    createChatbotHTML() {
        const chatbotHTML = `
            <div id="student-nav-bot-container" class="student-nav-bot-container">
                <!-- Floating Chat Button -->
                <button id="student-nav-bot-toggle" class="student-nav-bot-toggle" aria-label="Open navigation assistant">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
                
                <!-- Chat Modal -->
                <div id="student-nav-bot-modal" class="student-nav-bot-modal" style="display: none;">
                    <!-- Header -->
                    <div class="student-nav-bot-header">
                        <div class="student-nav-bot-title">
                            <span>Navigation Assistant</span>
                        </div>
                        <button id="student-nav-bot-close" class="student-nav-bot-close" aria-label="Close">×</button>
                    </div>
                    
                    <!-- Messages -->
                    <div id="student-nav-bot-messages" class="student-nav-bot-messages"></div>
                    
                    <!-- Quick Actions -->
                    <div class="student-nav-bot-quick-actions">
                        <button class="nav-quick-btn" data-route="profile">Profile</button>
                        <button class="nav-quick-btn" data-route="attendance">Attendance</button>
                        <button class="nav-quick-btn" data-route="results">Results</button>
                        <button class="nav-quick-btn" data-route="timetable">Timetable</button>
                        <button class="nav-quick-btn" data-route="assignments">Assignments</button>
                        <button class="nav-quick-btn" data-route="fees">Fees</button>
                    </div>
                    
                    <!-- Input -->
                    <div class="student-nav-bot-input-area">
                        <input 
                            type="text" 
                            id="student-nav-bot-input" 
                            placeholder="Ask me to navigate..."
                            maxlength="100"
                        >
                        <button id="student-nav-bot-send" class="student-nav-bot-send-btn" aria-label="Send">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const toggle = document.getElementById('student-nav-bot-toggle');
        const close = document.getElementById('student-nav-bot-close');
        const input = document.getElementById('student-nav-bot-input');
        const send = document.getElementById('student-nav-bot-send');
        const quickBtns = document.querySelectorAll('.nav-quick-btn');
        
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleChat());
        }
        
        if (close) {
            close.addEventListener('click', () => this.closeChat());
        }
        
        if (send) {
            send.addEventListener('click', () => this.handleSend());
        }
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }
        
        quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const route = e.target.getAttribute('data-route');
                if (route) {
                    this.navigateToRoute(route);
                }
            });
        });
    }
    
    /**
     * Toggle chat
     */
    toggleChat() {
        const modal = document.getElementById('student-nav-bot-modal');
        if (!modal) return;
        
        this.isOpen = !this.isOpen;
        modal.style.display = this.isOpen ? 'flex' : 'none';
        
        if (this.isOpen) {
            setTimeout(() => {
                const input = document.getElementById('student-nav-bot-input');
                if (input) input.focus();
            }, 100);
        }
    }
    
    /**
     * Close chat
     */
    closeChat() {
        const modal = document.getElementById('student-nav-bot-modal');
        if (modal) {
            modal.style.display = 'none';
            this.isOpen = false;
        }
    }
    
    /**
     * Add welcome message
     */
    addWelcomeMessage() {
        this.addMessage('bot', 'Hi 👋 I can help you navigate.\nAsk me to open Profile, Attendance, Results, Timetable, Assignments, or Fees.');
    }
    
    /**
     * Handle send
     */
    handleSend() {
        const input = document.getElementById('student-nav-bot-input');
        if (!input) return;
        
        const message = input.value.trim();
        if (message) {
            this.processMessage(message);
            input.value = '';
        }
    }
    
    /**
     * Process user message and navigate
     */
    processMessage(message) {
        // Add user message
        this.addMessage('user', message);
        
        // Detect intent (simple keyword matching)
        const normalized = message.toLowerCase().trim();
        let matchedRoute = null;
        let matchedKey = null;
        
        // Check for exact matches first
        for (const [key, route] of Object.entries(this.routes)) {
            if (normalized === key || normalized.includes(key)) {
                matchedRoute = route;
                matchedKey = key;
                break;
            }
        }
        
        // If no exact match, check for partial matches
        if (!matchedRoute) {
            for (const [key, route] of Object.entries(this.routes)) {
                const keyWords = key.split(' ');
                const messageWords = normalized.split(' ');
                
                // Check if any key word appears in message
                for (const keyWord of keyWords) {
                    if (messageWords.some(msgWord => msgWord.includes(keyWord) || keyWord.includes(msgWord))) {
                        matchedRoute = route;
                        matchedKey = key;
                        break;
                    }
                }
                if (matchedRoute) break;
            }
        }
        
        // Handle recognized command
        if (matchedRoute) {
            const friendlyName = this.getFriendlyName(matchedKey);
            this.addMessage('bot', `Taking you to ${friendlyName}...`);
            
            // Navigate after short delay
            setTimeout(() => {
                window.location.href = matchedRoute;
            }, 500);
        } else {
            // Unknown command - show helpful message
            this.addMessage('bot', 'I can help you navigate. Try Profile, Attendance, Results, Timetable, Assignments, or Fees.');
        }
    }
    
    /**
     * Navigate to route (for quick buttons)
     */
    navigateToRoute(routeKey) {
        const route = this.routes[routeKey];
        if (route) {
            const friendlyName = this.getFriendlyName(routeKey);
            this.addMessage('bot', `Taking you to ${friendlyName}...`);
            
            setTimeout(() => {
                window.location.href = route;
            }, 500);
        }
    }
    
    /**
     * Get friendly name for route
     */
    getFriendlyName(key) {
        const names = {
            'profile': 'Profile',
            'attendance': 'Attendance',
            'results': 'Results',
            'marks': 'Results',
            'grades': 'Results',
            'timetable': 'Timetable',
            'schedule': 'Timetable',
            'fees': 'Fees',
            'assignments': 'Assignments',
            'homework': 'Assignments',
            'notices': 'Notices',
            'announcements': 'Notices',
            'forgot password': 'Password Reset',
            'reset password': 'Password Reset',
            'change password': 'Change Password',
            'password': 'Password Settings',
            'dashboard': 'Dashboard',
            'home': 'Dashboard'
        };
        return names[key] || key;
    }
    
    /**
     * Add message to chat
     */
    addMessage(sender, text) {
        const messagesContainer = document.getElementById('student-nav-bot-messages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `student-nav-bot-message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Format text (preserve line breaks)
        const formattedText = text.replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${formattedText}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store message
        this.messages.push({ sender, text, timestamp });
    }
}

// Initialize when DOM is ready (only on student dashboard)
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on student dashboard
    if (window.location.pathname.includes('student_dashboard')) {
        window.studentNavBot = new StudentNavigationBot();
    }
});

