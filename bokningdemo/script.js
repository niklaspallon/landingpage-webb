import config from './config.js';

const { supabaseUrl, supabaseKey } = config;
const client = supabase.createClient(supabaseUrl, supabaseKey);

const bookingForm = document.getElementById('bookingForm');
const dateInput = document.getElementById('date');
const timeGrid = document.getElementById('timeGrid');
const selectedTimeInput = document.getElementById('selectedTime');
const prevDayButton = document.getElementById('prevDay');
const nextDayButton = document.getElementById('nextDay');
const bookingStatus = document.getElementById('bookingStatus');

// Tillgängliga tider
const availableTimes = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00"
];

// Sätt dagens datum och minimidatum med svensk tid
const today = new Date();
today.setHours(0, 0, 0, 0); // Nollställ tid för att jämföra endast datum
const todayString = today.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).split('/').join('-');

dateInput.min = todayString;
dateInput.value = todayString;

console.log('Dagens datum:', todayString);

// Uppdatera datum och ladda tider
function updateDate(date) {
    dateInput.value = date;
    loadAvailableTimes(date);
}

// Navigera till föregående dag
prevDayButton.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() - 1);
    
    // Kontrollera om det nya datumet är idag eller senare
    if (currentDate >= today) {
        const newDate = currentDate.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).split('/').join('-');
        updateDate(newDate);
    }
});

// Navigera till nästa dag
nextDayButton.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = currentDate.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).split('/').join('-');
    updateDate(newDate);
});

// Uppdatera när datum ändras manuellt
dateInput.addEventListener('change', (e) => {
    const selectedDate = new Date(e.target.value);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Om valt datum är före idag, sätt till idag
    if (selectedDate < today) {
        updateDate(todayString);
    } else {
        loadAvailableTimes(e.target.value);
    }
});

// Ladda tillgängliga tider
async function loadAvailableTimes(date) {
    try {
        // Hämta bokade tider för valt datum
        const { data: bookedTimes, error } = await client
            .from('Bokningar')
            .select('tid')
            .eq('datum', date);

        if (error) {
            console.error('Fel vid hämtning av bokade tider:', error);
            bookingStatus.textContent = 'Ett fel uppstod vid hämtning av tider';
            bookingStatus.className = 'status-message error';
            return;
        }

        // Skapa array med bokade tider och ta bort sekunder från formatet
        const bookedTimeSlots = bookedTimes ? bookedTimes.map(booking => booking.tid.slice(0, 5)) : [];
        console.log('Bokade tider (utan sekunder):', bookedTimeSlots); // För felsökning

        // Uppdatera tiderna i formuläret
        updateTimeGrid(bookedTimeSlots);
        
    } catch (error) {
        console.error('Fel vid hämtning av bokade tider:', error);
        bookingStatus.textContent = 'Ett fel uppstod vid hämtning av tider';
        bookingStatus.className = 'status-message error';
    }
}

// Uppdatera tidrutan
function updateTimeGrid(bookedTimeSlots) {
    timeGrid.innerHTML = '';
    selectedTimeInput.value = '';

    availableTimes.forEach(time => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.textContent = time;
        
        // Kontrollera om tiden är bokad (jämför utan sekunder)
        const isBooked = bookedTimeSlots.includes(time);
        
        if (isBooked) {
            timeSlot.className += ' booked';
        } else {
            timeSlot.className += ' available';
            timeSlot.addEventListener('click', () => selectTime(timeSlot, time));
        }
        
        timeGrid.appendChild(timeSlot);
    });
}

// Välj tid
function selectTime(timeSlot, time) {
    // Om denna tid redan är vald, avmarkera den
    if (timeSlot.classList.contains('selected')) {
        timeSlot.classList.remove('selected');
        selectedTimeInput.value = '';
        return;
    }
    
    // Ta bort tidigare val
    const previousSelected = timeGrid.querySelector('.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
    }
    
    // Markera ny tid
    timeSlot.classList.add('selected');
    selectedTimeInput.value = time;
}

// Hantera formulärinlämning
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedTimeInput.value) {
        alert('Vänligen välj en tid');
        return;
    }

    try {
        // Kontrollera om tiden redan är bokad
        const { data: existingBookings, error: checkError } = await client
            .from('Bokningar')
            .select('tid')
            .eq('datum', dateInput.value)
            .eq('tid', selectedTimeInput.value + ':00');

        if (checkError) throw checkError;

        if (existingBookings && existingBookings.length > 0) {
            bookingStatus.textContent = 'Tyvärr har denna tid precis blivit bokad. Vänligen välj en annan tid.';
            bookingStatus.className = 'status-message error';
            loadAvailableTimes(dateInput.value);
            return;
        }

        const formData = {
            namn: bookingForm.name.value,
            nummer: bookingForm.phone.value,
            datum: dateInput.value,
            tid: selectedTimeInput.value + ':00'
        };

        const { error } = await client
            .from('Bokningar')
            .insert([formData]);

        if (error) throw error;

        // Formatera datumet till svensk format
        const bokadDatum = new Date(dateInput.value).toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Visa bekräftelse med datum och tid
        bookingStatus.textContent = `Bokning genomförd för ${bokadDatum} kl. ${selectedTimeInput.value}!`;
        bookingStatus.className = 'status-message success';
        
        // Uppdatera tiderna för det valda datumet först
        await loadAvailableTimes(dateInput.value);
        
        // Återställ formuläret efter att tiderna har uppdaterats
        bookingForm.reset();
        dateInput.value = dateInput.value; // Behåll samma datum
        selectedTimeInput.value = ''; // Rensa vald tid
        
    } catch (error) {
        console.error('Fel vid bokning:', error);
        bookingStatus.textContent = 'Ett fel uppstod vid bokning';
        bookingStatus.className = 'status-message error';
    }
});

// Ladda tider för dagens datum när sidan laddas
loadAvailableTimes(todayString); 