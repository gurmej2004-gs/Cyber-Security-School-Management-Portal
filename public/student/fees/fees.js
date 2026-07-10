document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and has student role
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'student') {
        window.location.href = '../../login.html';
        return;
    }

    // Initialize tooltips
    initializeTooltips();
    
    // Add event listeners
    setupEventListeners();
    
    // Load fee data (in a real app, this would be an API call)
    loadFeeData();
});

function initializeTooltips() {
    // Initialize any tooltips using a library like Tippy.js if needed
    // Example: tippy('[data-tippy-content]');
}

function setupEventListeners() {
    // Pay Now button
    const payNowBtn = document.querySelector('.pay-now');
    if (payNowBtn) {
        payNowBtn.addEventListener('click', handlePayNow);
    }
    
    // Remove card button
    const removeCardBtns = document.querySelectorAll('.btn-remove');
    removeCardBtns.forEach(btn => {
        btn.addEventListener('click', handleRemoveCard);
    });
    
    // Add card button
    const addCardBtn = document.querySelector('.add-card');
    if (addCardBtn) {
        addCardBtn.addEventListener('click', handleAddCard);
    }
}

function loadFeeData() {
    // In a real app, this would fetch data from an API
    console.log('Loading fee data...');
    
    // Example of updating the UI with fetched data
    // This is just a placeholder - in a real app, you would use actual data
    setTimeout(() => {
        // Update any dynamic content here if needed
    }, 500);
}

function handlePayNow(e) {
    e.preventDefault();
    // In a real app, this would open a payment modal or redirect to a payment gateway
    alert('Redirecting to payment gateway...');
    console.log('Initiating payment...');
    
    // Example of what might happen after a successful payment
    // setTimeout(() => {
    //     updatePaymentStatus('2024-03-15');
    // }, 2000);
}

function handleRemoveCard(e) {
    e.preventDefault();
    const cardElement = e.target.closest('.payment-card');
    if (confirm('Are you sure you want to remove this payment method?')) {
        cardElement.style.opacity = '0.5';
        cardElement.style.pointerEvents = 'none';
        
        // In a real app, this would make an API call to remove the payment method
        setTimeout(() => {
            cardElement.remove();
            showNotification('Payment method removed successfully', 'success');
        }, 500);
    }
}

function handleAddCard(e) {
    e.preventDefault();
    // In a real app, this would open a form to add a new payment method
    alert('Opening add payment method form...');
    
    // Example of adding a new card
    // const newCard = {
    //     type: 'mastercard',
    //     last4: '4242',
    //     exp: '12/25'
    // };
    // addNewCardToUI(newCard);
}

function updatePaymentStatus(date) {
    // Find the row with the given date and update its status
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        if (row.cells[0].textContent === date) {
            const statusCell = row.cells[3];
            statusCell.innerHTML = '<span class="status-badge paid">Paid</span>';
            
            // Update the receipt link
            const receiptCell = row.cells[4];
            receiptCell.innerHTML = '<a href="#" class="receipt-link">Download</a>';
            
            // Show success message
            showNotification('Payment successful!', 'success');
        }
    });
    
    // Update the summary
    updateFeeSummary();
}

function updateFeeSummary() {
    // In a real app, this would recalculate based on the latest data
    const paidAmount = document.querySelector('.status.paid');
    const pendingAmount = document.querySelector('.status.pending');
    
    if (paidAmount && pendingAmount) {
        // Update the amounts (in a real app, this would come from the server)
        paidAmount.textContent = 'Paid: $2,250.00';
        pendingAmount.textContent = 'Pending: $250.00';
    }
}

function showNotification(message, type = 'info') {
    // In a real app, you might use a toast notification library
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// In a real app, you would have functions to handle the payment form submission,
// validate input, and communicate with your backend API.
