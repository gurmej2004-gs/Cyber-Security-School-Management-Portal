// Student Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and has student role
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    
    if (!token || userRole !== 'student') {
        window.location.href = '../login.html';
        return;
    }

    // Update dashboard stats (example data)
    updateDashboardStats();

    // Fetch and render student's own profile
    fetchOwnProfile();

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

async function fetchOwnProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    try {
        const res = await fetch('/students/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.status === 401 || res.status === 403) {
            // auth failed; redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            window.location.href = '../login.html';
            return;
        }
        const data = await res.json();
        if (data.status === 'success' && data.data) {
            const s = data.data;
            // Optionally render into placeholders if present
            const nameEl = document.getElementById('student-name');
            const ageEl = document.getElementById('student-age');
            const gradeEl = document.getElementById('student-grade');
            if (nameEl) nameEl.textContent = s.name ?? '';
            if (ageEl) ageEl.textContent = (s.age ?? '') + '';
            if (gradeEl) gradeEl.textContent = s.grade ?? '';
        } else {
            console.warn('Student profile not found or failed to fetch:', data);
        }
    } catch (e) {
        console.error('Error fetching own profile:', e);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    window.location.href = '../login.html';
}

function updateDashboardStats() {
    // In a real app, this would fetch data from an API
    document.getElementById('course-count').textContent = '5';
    document.getElementById('assignments-due').textContent = '3';
    document.getElementById('gpa').textContent = '3.7';
}
