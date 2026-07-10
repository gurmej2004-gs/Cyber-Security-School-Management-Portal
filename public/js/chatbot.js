/**
 * School Management System Chatbot Widget
 * Provides intelligent assistance for students, teachers, and admins
 */

class SchoolChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.userRole = this.getUserRole();
        this.init();
    }

    getUserRole() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch (e) {
            return null;
        }
    }

    init() {
        this.createChatbotHTML();
        this.attachEventListeners();
        this.addWelcomeMessage();
    }

    createChatbotHTML() {
        const chatbotHTML = `
            <div id="chatbot-container" class="chatbot-container">
                <!-- Chatbot Toggle Button -->
                <div id="chatbot-toggle" class="chatbot-toggle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.38 14.99 3.06 16.28L2 22L7.72 20.94C9.01 21.62 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.74 20 9.54 19.75 8.46 19.3L8 19.11L4.91 19.91L5.71 16.82L5.52 16.36C5.07 15.28 4.82 14.08 4.82 12.82C4.82 7.58 8.58 3.82 13.82 3.82C19.06 3.82 22.82 7.58 22.82 12.82C22.82 18.06 19.06 21.82 13.82 21.82H12V20Z" fill="white"/>
                    </svg>
                    <span class="notification-badge" id="chatbot-badge" style="display: none;">1</span>
                </div>

                <!-- Chatbot Window -->
                <div id="chatbot-window" class="chatbot-window" style="display: none;">
                    <!-- Header -->
                    <div class="chatbot-header">
                        <div class="chatbot-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#4CAF50"/>
                                <circle cx="9" cy="9" r="1.5" fill="#4CAF50"/>
                                <circle cx="15" cy="9" r="1.5" fill="#4CAF50"/>
                                <path d="M8 14C8.5 15 10 16 12 16C14 16 15.5 15 16 14" stroke="#4CAF50" stroke-width="1.5" fill="none"/>
                            </svg>
                            <span>School Assistant</span>
                            <div class="status-indicator"></div>
                        </div>
                        <button id="chatbot-close" class="chatbot-close">×</button>
                    </div>

                    <!-- Messages Area -->
                    <div id="chatbot-messages" class="chatbot-messages">
                        <!-- Messages will be dynamically added here -->
                    </div>

                    <!-- Quick Actions -->
                    <div class="chatbot-quick-actions" id="chatbot-quick-actions">
                        <!-- Quick action buttons will be added based on user role -->
                    </div>

                    <!-- Input Area -->
                    <div class="chatbot-input-area">
                        <input 
                            type="text" 
                            id="chatbot-input" 
                            placeholder="Ask me anything about the school system..."
                            maxlength="500"
                        >
                        <button id="chatbot-send" class="chatbot-send-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="white"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Typing Indicator -->
                    <div id="chatbot-typing" class="chatbot-typing" style="display: none;">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span>Assistant is typing...</span>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        this.loadQuickActions();
    }

    loadQuickActions() {
        const quickActionsContainer = document.getElementById('chatbot-quick-actions');
        let actions = [];

        switch (this.userRole) {
            case 'admin':
                actions = [
                    { text: '📊 System Status', query: 'show system status' },
                    { text: '🛡️ Security Alerts', query: 'show security alerts today' },
                    { text: '👥 User Stats', query: 'show user statistics' },
                    { text: '🔒 Blocked IPs', query: 'show blocked IPs' }
                ];
                break;
            case 'teacher':
                actions = [
                    { text: '📚 My Classes', query: 'show my classes' },
                    { text: '👨‍🎓 Student List', query: 'show my students' },
                    { text: '📅 Schedule', query: 'show my schedule today' },
                    { text: '📝 Assignments', query: 'show pending assignments' }
                ];
                break;
            case 'student':
                actions = [
                    { text: '📊 My Grades', query: 'show my grades' },
                    { text: '📅 Attendance', query: 'show my attendance' },
                    { text: '💰 Fees', query: 'check my fees' },
                    { text: '📚 Schedule', query: 'show my schedule' }
                ];
                break;
            default:
                actions = [
                    { text: '🔐 Login Help', query: 'help with login' },
                    { text: '❓ About System', query: 'about this system' }
                ];
        }

        quickActionsContainer.innerHTML = actions.map(action => 
            `<button class="quick-action-btn" data-query="${action.query}">${action.text}</button>`
        ).join('');

        // Add event listeners to quick action buttons
        quickActionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-action-btn')) {
                const query = e.target.getAttribute('data-query');
                this.sendMessage(query);
            }
        });
    }

    attachEventListeners() {
        const toggle = document.getElementById('chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const input = document.getElementById('chatbot-input');
        const send = document.getElementById('chatbot-send');

        toggle.addEventListener('click', () => this.toggleChatbot());
        close.addEventListener('click', () => this.closeChatbot());
        send.addEventListener('click', () => this.handleSend());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSend();
            }
        });

        input.addEventListener('input', (e) => {
            const sendBtn = document.getElementById('chatbot-send');
            sendBtn.disabled = e.target.value.trim() === '';
        });
    }

    addWelcomeMessage() {
        const welcomeMessages = {
            admin: "👋 Hello Admin! I can help you monitor system security, check user statistics, and manage the school system. What would you like to know?",
            teacher: "👋 Hello! I'm here to help you with your classes, students, and teaching schedule. How can I assist you today?",
            student: "👋 Hi there! I can help you check your grades, attendance, fees, and schedule. What would you like to know?",
            default: "👋 Welcome to the School Management System! Please log in to access personalized assistance."
        };

        const message = welcomeMessages[this.userRole] || welcomeMessages.default;
        this.addMessage('bot', message);
    }

    toggleChatbot() {
        const window = document.getElementById('chatbot-window');
        const badge = document.getElementById('chatbot-badge');
        
        if (this.isOpen) {
            this.closeChatbot();
        } else {
            window.style.display = 'block';
            badge.style.display = 'none';
            this.isOpen = true;
            
            // Focus on input
            setTimeout(() => {
                document.getElementById('chatbot-input').focus();
            }, 100);
        }
    }

    closeChatbot() {
        const window = document.getElementById('chatbot-window');
        window.style.display = 'none';
        this.isOpen = false;
    }

    handleSend() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (message) {
            this.sendMessage(message);
            input.value = '';
            document.getElementById('chatbot-send').disabled = true;
        }
    }

    async sendMessage(message) {
        // Add user message
        this.addMessage('user', message);
        
        // Show typing indicator
        this.showTyping();
        
        try {
            const response = await this.callChatbotAPI(message);
            this.hideTyping();
            this.addMessage('bot', response.message, response.type);
            
            // Show notification badge if window is closed
            if (!this.isOpen) {
                document.getElementById('chatbot-badge').style.display = 'block';
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('bot', '❌ Sorry, I encountered an error. Please try again later.', 'error');
        }
    }

    async callChatbotAPI(message) {
        const token = localStorage.getItem('token');
        const sessionId = localStorage.getItem('sessionId');
        
        const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Session-Id': sessionId
            },
            body: JSON.stringify({ 
                message: message,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    }

    addMessage(sender, text, type = 'info') {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}-message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(text)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add animation
        setTimeout(() => {
            messageDiv.classList.add('message-appear');
        }, 10);
    }

    formatMessage(text) {
        // Convert markdown-like formatting to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTyping() {
        document.getElementById('chatbot-typing').style.display = 'flex';
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        document.getElementById('chatbot-typing').style.display = 'none';
    }

    // Security awareness features
    showSecurityAlert(alertType, message) {
        const alertMessage = `🚨 **Security Alert**: ${message}`;
        this.addMessage('bot', alertMessage, 'warning');
        
        if (!this.isOpen) {
            this.toggleChatbot();
        }
    }

    // Public methods for external integration
    notifySecurityEvent(event) {
        const messages = {
            'ip_blocked': `🛡️ **IPS Alert**: Suspicious IP ${event.ip} has been blocked due to multiple failed login attempts.`,
            'waf_blocked': `🛡️ **WAF Alert**: Blocked ${event.attackType} attack from IP ${event.ip}.`,
            'phishing_detected': `🎣 **Anti-Phishing**: Blocked suspicious request from ${event.domain}.`,
            'app_cloning': `📱 **App Cloning**: Detected cloned app attempt from ${event.userAgent}.`
        };

        const message = messages[event.type] || `🔒 Security event detected: ${event.type}`;
        this.showSecurityAlert(event.type, message);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.schoolChatbot = new SchoolChatbot();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchoolChatbot;
}
