// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and has admin role
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    
    if (!token || userRole !== 'admin') {
        window.location.href = '../login.html';
        return;
    }

    // Update dashboard stats (example data)
    updateDashboardStats();

    // Add event listeners
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '../login.html') {
                e.preventDefault();
                logout();
            }
        });
    });
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    window.location.href = '../login.html';
}

function updateDashboardStats() {
    // In a real app, this would fetch data from an API
    document.getElementById('student-count').textContent = '125';
    document.getElementById('teacher-count').textContent = '15';
    document.getElementById('course-count').textContent = '8';
}
