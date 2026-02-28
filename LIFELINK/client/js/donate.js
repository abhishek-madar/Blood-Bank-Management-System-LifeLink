document.addEventListener('DOMContentLoaded', function() {
    const checkEligibilityBtn = document.getElementById('checkEligibility');
    const submitDonationBtn = document.getElementById('submitDonation');
    
    if (checkEligibilityBtn) {
        checkEligibilityBtn.addEventListener('click', checkEligibility);
    }
    
    if (submitDonationBtn) {
        submitDonationBtn.addEventListener('click', submitDonation);
    }
    
    loadDonationHistory();
});

async function checkEligibility() {
    const age = document.getElementById('age')?.value;
    const weight = document.getElementById('weight')?.value;
    const hasSurgery = document.getElementById('hasSurgery')?.checked || false;
    const hasIllness = document.getElementById('hasIllness')?.checked || false;
    
    if (!age || !weight) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please login to check eligibility', 'error');
            window.location.href = '/login';
            return;
        }
        
        const response = await fetch('/api/donations/check-eligibility', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ age: parseInt(age), weight: parseInt(weight), hasSurgery, hasIllness })
        });
        
        const result = await response.json();
        const resultDiv = document.getElementById('eligibilityResult');
        
        if (result.eligible) {
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div style="background: #d4edda; color: #155724; padding: 20px; border-radius: 10px; margin-top: 20px;">
                        <h3>You are eligible to donate!</h3>
                        <p>Please fill the donation form below.</p>
                    </div>
                `;
            }
            const donationSection = document.getElementById('donationSection');
            if (donationSection) donationSection.style.display = 'block';
        } else {
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px; margin-top: 20px;">
                        <h3>Sorry, you are not eligible</h3>
                        <p>${result.reason || 'You do not meet the eligibility criteria.'}</p>
                    </div>
                `;
            }
            const donationSection = document.getElementById('donationSection');
            if (donationSection) donationSection.style.display = 'none';
        }
    } catch (error) {
        showNotification('Error checking eligibility', 'error');
    }
}

async function submitDonation(e) {
    e.preventDefault();
    
    const bloodGroup = document.getElementById('donorBloodGroup')?.value;
    const donationDate = document.getElementById('donationDate')?.value;
    const donationCenter = document.getElementById('donationCenter')?.value;
    
    if (!bloodGroup || !donationDate || !donationCenter) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please login to register donation', 'error');
            window.location.href = '/login';
            return;
        }
        
        const response = await fetch('/api/donations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bloodGroup, donationDate, donationCenter, eligibilityStatus: 'eligible' })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Donation registered successfully!', 'success');
            document.getElementById('donationForm')?.reset();
            document.getElementById('donationSection').style.display = 'none';
            document.getElementById('eligibilityResult').innerHTML = '';
            loadDonationHistory();
        } else {
            showNotification(result.message || 'Error registering donation', 'error');
        }
    } catch (error) {
        showNotification('Server error', 'error');
    }
}

async function loadDonationHistory() {
    const historyDiv = document.getElementById('donationHistory');
    if (!historyDiv) return;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            historyDiv.innerHTML = '<p>Please login to view your donation history.</p>';
            return;
        }
        
        const response = await fetch('/api/donations/my-donations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const donations = await response.json();
        
        if (!donations || donations.length === 0) {
            historyDiv.innerHTML = '<p>No donation history yet.</p>';
            return;
        }
        
        historyDiv.innerHTML = donations.map(donation => `
            <div class="history-item">
                <p><strong>Date:</strong> ${formatDate(donation.donationDate)}</p>
                <p><strong>Blood Group:</strong> ${donation.bloodGroup}</p>
                <p><strong>Center:</strong> ${donation.donationCenter}</p>
                <button onclick="downloadDonationPDF('${donation._id}')" class="btn btn-small">Download PDF</button>
            </div>
        `).join('');
    } catch (error) {
        historyDiv.innerHTML = '<p>Error loading history</p>';
    }
}

async function downloadDonationPDF(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/donations/pdf/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donation-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        showNotification('Error downloading PDF', 'error');
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function showNotification(message, type) {
    const existingNotification = document.querySelector('.popup-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'popup-notification';
    
    popup.innerHTML = `
        <div class="popup-icon"></div>
        <div class="popup-message">${message}</div>
        <button class="popup-close">&times;</button>
    `;
    
    document.body.appendChild(popup);
    
    popup.querySelector('.popup-close').addEventListener('click', () => {
        popup.remove();
    });
    
    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
        }
    }, 3000);
}
