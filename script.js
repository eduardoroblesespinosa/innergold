document.addEventListener('DOMContentLoaded', function () {
    const STATE_KEY = 'innerGoldState';

    // --- State Management ---
    let state = {
        startDate: new Date().toISOString(),
        relapses: 0,
        eliminatedThoughtsToday: 0,
        lastEliminationDate: null,
        progressLog: [] // { date, energy, emotionalState }
    };

    function loadState() {
        const savedState = localStorage.getItem(STATE_KEY);
        if (savedState) {
            state = JSON.parse(savedState);
        }
        // Reset daily counters if it's a new day
        const today = new Date().toISOString().split('T')[0];
        if (state.lastEliminationDate !== today) {
            state.eliminatedThoughtsToday = 0;
            state.lastEliminationDate = today;
            saveState();
        }
    }

    function saveState() {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    }

    // --- UI Update Functions ---
    const daysCounterEl = document.getElementById('days-counter');
    const thoughtsCounterEl = document.getElementById('thoughts-counter');
    const chartCanvas = document.getElementById('progress-chart');
    let progressChart;

    function updateCounters() {
        const startDate = new Date(state.startDate);
        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        daysCounterEl.textContent = diffDays;

        thoughtsCounterEl.textContent = state.eliminatedThoughtsToday;
    }
    
    function updateChart() {
        if (!chartCanvas) return;
        
        const labels = state.progressLog.map(log => new Date(log.date).toLocaleDateString());
        const data = state.progressLog.map(log => log.energy);

        if(progressChart) {
            progressChart.destroy();
        }

        progressChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Perceived Energy Level',
                    data: data,
                    fill: true,
                    borderColor: 'rgb(212, 175, 55)',
                    backgroundColor: 'rgba(212, 175, 55, 0.2)',
                    tension: 0.1,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgb(212, 175, 55)'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // --- Toasts/Alerts ---
    const toastEl = document.getElementById('action-toast');
    const toast = new bootstrap.Toast(toastEl);

    function showAlert(message, title = 'Success', type = 'success') {
        const toastTitle = toastEl.querySelector('.toast-title');
        const toastBody = toastEl.querySelector('.toast-body');
        
        toastTitle.textContent = title;
        toastBody.textContent = message;

        toastEl.classList.remove('bg-success', 'bg-warning', 'bg-danger');
        if (type === 'success') toastEl.classList.add('bg-success', 'text-white');
        if (type === 'warning') toastEl.classList.add('bg-warning', 'text-dark');
        if (type === 'error') toastEl.classList.add('bg-danger', 'text-white');

        toast.show();
    }


    // --- Event Listeners ---
    document.getElementById('reset-counter-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your progress? This action cannot be undone.')) {
            state.startDate = new Date().toISOString();
            state.relapses += 1;
            saveState();
            updateCounters();
            showAlert('Counter has been reset. A new journey begins now.', 'Warning', 'warning');
        }
    });

    document.getElementById('eliminate-thought-btn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        
        const audio = new Audio('guided-exercise.mp3');
        audio.play().catch(error => console.error("Audio play failed:", error));

        audio.onended = () => {
            state.eliminatedThoughtsToday += 1;
            state.lastEliminationDate = new Date().toISOString().split('T')[0];
            saveState();
            updateCounters();
            showAlert('Thought eliminated. Energy reclaimed.', 'Victory');
            btn.disabled = false;
        };
        audio.onerror = () => {
             showAlert('Could not play guided exercise.', 'Error', 'error');
             btn.disabled = false;
        }
    });

    document.getElementById('log-progress-btn').addEventListener('click', () => {
        const energyLevel = document.getElementById('energy-level').value;
        const emotionalState = document.getElementById('emotional-state').value;
        
        if (!emotionalState) {
            showAlert('Please describe your emotional state.', 'Incomplete', 'warning');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        // Remove today's log if it already exists to prevent duplicates
        state.progressLog = state.progressLog.filter(log => log.date !== today);

        state.progressLog.push({
            date: today,
            energy: parseInt(energyLevel, 10),
            emotionalState: emotionalState
        });

        // Keep log from getting too large
        if(state.progressLog.length > 30) {
            state.progressLog.shift();
        }

        saveState();
        updateChart();
        showAlert('Progress for today has been logged.', 'Logged');
        document.getElementById('emotional-state').value = '';
    });

    // Smooth scrolling for nav links
    document.querySelectorAll('a.nav-link[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // --- Initialization ---
    loadState();
    updateCounters();
    updateChart();
});

