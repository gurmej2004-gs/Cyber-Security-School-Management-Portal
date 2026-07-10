// Teacher Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and has teacher role
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    
    if (!token || userRole !== 'teacher') {
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
    document.getElementById('class-count').textContent = '4';
    document.getElementById('student-count').textContent = '32';
    document.getElementById('pending-count').textContent = '12';
}
