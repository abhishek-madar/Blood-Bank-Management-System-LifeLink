document.addEventListener('DOMContentLoaded', function() {
    const requestForm = document.getElementById('requestForm');
    const submitBtn = document.getElementById('submitRequest');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', submitRequest);
    }
    
    if (requestForm) {
        requestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitRequest(e);
        });
    }
    
    loadRequestHistory();
});

async function submitRequest(e) {
    e.preventDefault();
    
    const patientName = document.getElementById('patientName')?.value;
    const bloodGroup = document.getElementById('bloodGroup')?.value;
    const unitsRequired = document.getElementById('unitsRequired')?.value;
    const hospitalName = document.getElementById('hospitalName')?.value;
    const urgencyLevel = document.getElementById('urgencyLevel')?.value || 'normal';
    const contactNumber = document.getElementById('contactNumber')?.value;
    const submitBtn = document.getElementById('submitRequest');
    
    if (!patientName || !bloodGroup || !unitsRequired || !hospitalName || !contactNumber) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    if (!/^\d{10}$/.test(contactNumber)) {
        showNotification('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please login to submit request', 'error');
            window.location.href = '/login';
            return;
        }
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }
        
        const response = await fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                patientName, 
                bloodGroup, 
                unitsRequired: parseInt(unitsRequired), 
                hospitalName, 
                urgencyLevel, 
                contactNumber 
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Request submitted successfully!', 'success');
            
            document.getElementById('patientName').value = '';
            document.getElementById('bloodGroup').value = '';
            document.getElementById('unitsRequired').value = '';
            document.getElementById('hospitalName').value = '';
            document.getElementById('contactNumber').value = '';
            document.getElementById('urgencyLevel').value = 'normal';
            
            document.querySelectorAll('.urgency-option').forEach(opt => {
                opt.classList.remove('selected');
                if (opt.classList.contains('normal')) {
                    opt.classList.add('selected');
                }
            });
            
            loadRequestHistory();
        } else {
            showNotification(result.message || 'Error submitting request', 'error');
        }
    } catch (error) {
        console.error('Submit request error:', error);
        showNotification('Server error. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    }
}

async function loadRequestHistory() {
    const historyDiv = document.getElementById('requestHistory');
    if (!historyDiv) return;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            historyDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Please login to view your request history.</p>';
            return;
        }
        
        const response = await fetch('/api/requests/my-requests', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }
        
        const requests = await response.json();
        
        if (!requests || requests.length === 0) {
            historyDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No request history yet.</p>';
            return;
        }
        
        historyDiv.innerHTML = requests.map(request => `
            <div class="history-item" style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #ff4757;">
                <div>
                    <p><strong>Patient:</strong> ${request.patientName}</p>
                    <p><strong>Blood Group:</strong> ${request.bloodGroup}</p>
                    <p><strong>Units:</strong> ${request.unitsRequired}</p>
                    <p><strong>Hospital:</strong> ${request.hospitalName}</p>
                    <p><strong>Urgency:</strong> <span style="color: ${request.urgencyLevel === 'emergency' ? '#dc3545' : (request.urgencyLevel === 'urgent' ? '#ffc107' : '#28a745')};">${request.urgencyLevel}</span></p>
                    <p><strong>Status:</strong> <span style="color: ${request.status === 'completed' ? '#28a745' : (request.status === 'pending' ? '#ffc107' : '#dc3545')};">${request.status}</span></p>
                </div>
                <button onclick="downloadRequestPDF('${request._id}')" style="padding: 8px 15px; background: #ff4757; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    <i class="fas fa-download"></i> Download PDF
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load request history error:', error);
        historyDiv.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px;">Error loading history. Please try again.</p>';
    }
}

async function downloadRequestPDF(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/requests/pdf/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            showNotification('Error downloading PDF', 'error');
            return;
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `request-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download PDF error:', error);
        showNotification('Error downloading PDF', 'error');
    }
}

function selectUrgency(level, element) {
    const options = document.querySelectorAll('.urgency-option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    let selectedOption;
    if (event && event.target) {
        selectedOption = event.target.closest('.urgency-option');
    } else {
        selectedOption = document.querySelector(`.urgency-option.${level}`);
    }
    
    if (selectedOption) {
        selectedOption.classList.add('selected');
        document.getElementById('urgencyLevel').value = level;
    }
}

function showNotification(message, type) {
    const existingNotification = document.querySelector('.popup-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'popup-notification';
    
    let icon = '&#10004;'; 
    if (type === 'error') icon = '&#10006;'; 
    if (type === 'info') icon = '&#8505;'; 
    
    popup.innerHTML = `
        <div class="popup-icon">${icon}</div>
        <div class="popup-message">${message}</div>
        <button class="popup-close">&times;</button>
    `;
    
    document.body.appendChild(popup);
    
    popup.querySelector('.popup-close').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });
    
    setTimeout(() => {
        if (popup.parentElement) {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        }
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    const normalOption = document.querySelector('.urgency-option.normal');
    if (normalOption) {
        normalOption.classList.add('selected');
    }
});