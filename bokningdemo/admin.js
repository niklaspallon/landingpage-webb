import config from './config.js';

const { supabaseUrl, supabaseKey } = config;
const client = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const loginForm = document.getElementById('loginForm');
const dateFilter = document.getElementById('dateFilter');
const bookingsTableBody = document.getElementById('bookingsTableBody');

// Kontrollera om användaren är inloggad
const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
if (isLoggedIn) {
    showAdminSection();
}

// Login hantering
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;

    try {
        const { data, error } = await client
            .from('admin_password')
            .select('*');

        if (error) throw error;

        const validPassword = data.find(row => row.password === password);

        if (validPassword) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showAdminSection();
        } else {
            alert('Felaktigt lösenord');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Ett fel uppstod vid inloggning');
    }
});

// Visa admin-sektionen
function showAdminSection() {
    loginSection.style.display = 'none';
    adminSection.style.display = 'block';
    loadBookings();
}

// Ladda bokningar
async function loadBookings(date = null) {
    try {
        let query = client
            .from('Bokningar')
            .select('*')
            .order('datum', { ascending: true })
            .order('tid', { ascending: true });

        if (date) {
            query = query.eq('datum', date);
        }

        const { data: bookings, error } = await query;

        if (error) throw error;

        displayBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        alert('Ett fel uppstod vid laddning av bokningar');
    }
}

// Visa bokningar i tabellen
function displayBookings(bookings) {
    bookingsTableBody.innerHTML = '';

    if (bookings.length === 0) {
        const row = bookingsTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.className = 'no-bookings';
        cell.textContent = 'Inga bokningar hittades';
        return;
    }

    bookings.forEach(booking => {
        const row = bookingsTableBody.insertRow();
        
        // Formatera datum till svensk format
        const date = new Date(booking.datum);
        const formattedDate = date.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        row.insertCell().textContent = formattedDate;
        row.insertCell().textContent = booking.tid.slice(0, 5); // Ta bort sekunder
        row.insertCell().textContent = booking.namn;
        row.insertCell().textContent = booking.nummer;

        const actionCell = row.insertCell();
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Ta bort';
        deleteButton.onclick = () => deleteBooking(booking.id);
        actionCell.appendChild(deleteButton);
    });
}

// Hantera datumfilter
dateFilter.addEventListener('change', (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
        loadBookings(selectedDate);
    } else {
        loadBookings();
    }
});

// Ta bort bokning
async function deleteBooking(id) {
    if (!confirm('Är du säker på att du vill ta bort denna bokning?')) {
        return;
    }

    try {
        const { error } = await client
            .from('Bokningar')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Uppdatera listan efter borttagning
        const currentDate = dateFilter.value;
        loadBookings(currentDate);
    } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Ett fel uppstod vid borttagning av bokningen');
    }
} 