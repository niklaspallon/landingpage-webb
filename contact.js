// Handle form submission
document.getElementById('contactForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Show loading state
    const button = this.querySelector('button');
    const originalText = button.textContent;
    button.textContent = 'Skickar...';
    button.disabled = true;

    const formStatus = document.getElementById('formStatus');
    formStatus.style.display = 'none';

    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };

    try {
        // Validera formulärdata
        if (!formData.name || !formData.email || !formData.message) {
            throw new Error('Vänligen fyll i alla fält');
        }

        if (!formData.email.includes('@')) {
            throw new Error('Vänligen ange en giltig e-postadress');
        }

        // Send to email endpoint
        const response = await fetch('https://incomparable-marzipan-3d2dfc.netlify.app/.netlify/functions/sendEmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'no-cors',
            body: JSON.stringify(formData)
        });

        // I no-cors läge kan vi inte läsa response body eller status
        // Vi antar att det gick bra om vi kommer hit
        formStatus.textContent = 'Tack för ditt meddelande! Jag återkommer så snart som möjligt.';
        formStatus.className = 'form-status success';
        formStatus.style.display = 'block';
        formStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Reset form
        this.reset();
    } catch (error) {
        // Show error message
        formStatus.textContent = error.message || 'Ett fel uppstod när meddelandet skulle skickas. Vänligen försök igen eller kontakta mig via e-post.';
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
        formStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.error('Error:', error);
    } finally {
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
    }
}); 