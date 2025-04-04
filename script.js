// Global variables
let currentSearchTerm = '';

// Adsense initialization
/*
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any ads on the page
    (adsbygoogle = window.adsbygoogle || []).push({});
    (adsbygoogle = window.adsbygoogle || []).push({});
});
*/

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load saved data from localStorage
    const savedData = JSON.parse(localStorage.getItem('babyFoodTracker')) || {
        currentDay: 1,
        foods: [],
        completedFoods: {}
    };

    // Load theme preference
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggle(theme);

    // Handle dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeToggle(newTheme);
    });

    // Update UI with saved data
    updateProgress(savedData.currentDay);
    renderFoodList(savedData.foods);
    renderFoodGrid(savedData.completedFoods);

    // Handle view toggle
    const calendarViewBtn = document.getElementById('calendar-view');
    const formViewBtn = document.getElementById('form-view');
    const customFoodForm = document.getElementById('custom-food-form');
    const foodGridSection = document.getElementById('food-grid-section');

    calendarViewBtn.addEventListener('click', () => {
        calendarViewBtn.classList.add('active');
        formViewBtn.classList.remove('active');
        customFoodForm.style.display = 'none';
        foodGridSection.style.display = 'block';
    });

    formViewBtn.addEventListener('click', () => {
        formViewBtn.classList.add('active');
        calendarViewBtn.classList.remove('active');
        customFoodForm.style.display = 'block';
        foodGridSection.style.display = 'none';
    });

    // Handle category filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterFoodGrid();
        });
    });

    // Handle form submission for custom foods
    const foodForm = document.getElementById('food-form');
    foodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const foodName = document.getElementById('food-name').value;
        const category = document.getElementById('food-category').value;
        const reaction = document.getElementById('reaction').value;
        const notes = document.getElementById('notes').value;
        const date = new Date().toLocaleDateString();

        // Create new food entry
        const newFood = {
            id: Date.now(),
            name: foodName,
            category,
            reaction,
            notes,
            date,
            day: savedData.currentDay
        };

        // Update saved data
        savedData.foods.push(newFood);
        savedData.currentDay = Math.min(savedData.currentDay + 1, 100);
        
        // Save to localStorage
        localStorage.setItem('babyFoodTracker', JSON.stringify(savedData));

        // Update UI
        updateProgress(savedData.currentDay);
        renderFoodList(savedData.foods);

        // Reset form
        foodForm.reset();
    });

    // Add search functionality
    const foodSearch = document.getElementById('food-search');
    foodSearch.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase();
        filterFoodGrid();
    });

    // Modal and Tab functionality
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const closeModal = document.getElementById('close-modal');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const emailDataBtn = document.getElementById('email-data');
    const exportDataTextarea = document.getElementById('export-data');
    const importDataTextarea = document.getElementById('import-data');
    const importDataBtn = document.getElementById('import-data-btn');

    // Open modal
    settingsToggle.addEventListener('click', () => {
        settingsModal.classList.add('active');
        // Show export tab by default
        showTab('export');
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            showTab(tabId);
        });
    });

    function showTab(tabId) {
        // Update tab buttons
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-tab') === tabId);
        });

        // Update tab panes
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabId}-tab`);
        });

        // If showing export tab, update the data
        if (tabId === 'export') {
            updateExportData();
        }
    }

    // Update export data functionality
    function updateExportData() {
        const savedData = localStorage.getItem('babyFoodTracker') || '{}';
        exportDataTextarea.value = encodeData(savedData);
    }

    // Copy to clipboard functionality
    exportDataTextarea.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(exportDataTextarea.value);
            const originalLabel = exportDataTextarea.previousElementSibling.textContent;
            exportDataTextarea.previousElementSibling.textContent = '✅ Copied to clipboard!';
            setTimeout(() => {
                exportDataTextarea.previousElementSibling.textContent = originalLabel;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard. Please try selecting and copying manually.');
        }
    });

    // Email data functionality
    emailDataBtn.addEventListener('click', () => {
        const savedData = localStorage.getItem('babyFoodTracker') || '{}';
        const encodedData = encodeData(savedData);
        const mailtoLink = `mailto:?subject=Baby Food Tracker Data&body=${encodeURIComponent(encodedData)}`;
        window.location.href = mailtoLink;
    });

    // Import data functionality
    importDataBtn.addEventListener('click', () => {
        try {
            const encodedData = importDataTextarea.value.trim();
            if (!encodedData) {
                alert('Please enter encoded data to import.');
                return;
            }

            const decodedData = decodeData(encodedData);
            if (!decodedData || typeof decodedData !== 'object') {
                throw new Error('Invalid data format');
            }

            localStorage.setItem('babyFoodTracker', JSON.stringify(decodedData));
            
            // Update the UI components instead of calling updateUI
            const savedData = decodedData;
            updateProgress(savedData.currentDay);
            renderFoodList(savedData.foods);
            renderFoodGrid(savedData.completedFoods);
            
            settingsModal.classList.remove('active');
            alert('Data imported successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing data. Please check the format and try again.');
        }
    });
});

// Update progress display
function updateProgress(day) {
    const progressElement = document.getElementById('progress');
    const dayElement = document.getElementById('current-day');
    
    day = Number(day);
    dayElement.textContent = day;
    progressElement.style.width = `${(day / 100) * 100}%`;
}

// Render the food grid
function renderFoodGrid(completedFoods, filteredFoods = null) {
    const foodGrid = document.getElementById('food-grid');
    foodGrid.innerHTML = '';

    // Use filtered foods if provided, otherwise use all foods
    const foodsToRender = filteredFoods || Object.values(recommendedFoods).flat();

    foodsToRender.forEach(food => {
        const foodCard = document.createElement('div');
        const entries = completedFoods[food.name] || [];
        
        foodCard.className = `food-card ${entries.length > 0 ? 'completed' : ''}`;
        
        foodCard.innerHTML = `
            <h4>${food.name}</h4>
            <div class="category">${food.category}</div>
            ${entries.length > 0 ? `<div class="entry-count">Entries: ${entries.length}</div>` : ''}
        `;

        // Make the entire card clickable to add to log
        foodCard.addEventListener('click', () => {
            addFoodToLog(food);
        });

        foodGrid.appendChild(foodCard);
    });
}

// Filter food grid by category
function filterFoodGrid() {
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
    const savedData = JSON.parse(localStorage.getItem('babyFoodTracker')) || {
        currentDay: 1,
        foods: [],
        completedFoods: {}
    };
    
    const allFoods = Object.values(recommendedFoods).flat();
    let filteredFoods = allFoods.filter(food => {
        const matchesCategory = activeCategory === 'all' || 
                              activeCategory === 'untried' && !savedData.completedFoods[food.name] ||
                              food.category === activeCategory;
        
        const matchesSearch = food.name.toLowerCase().includes(currentSearchTerm);
        
        return matchesCategory && matchesSearch;
    });

    renderFoodGrid(savedData.completedFoods, filteredFoods);
}

// Update food status in localStorage
function updateFoodStatus(foodName, reaction, notes) {
    const savedData = JSON.parse(localStorage.getItem('babyFoodTracker')) || {
        currentDay: 1,
        foods: [],
        completedFoods: {}
    };

    // Initialize completedFoods entry as an array if it doesn't exist
    if (!savedData.completedFoods[foodName]) {
        savedData.completedFoods[foodName] = [];
    }

    // Create a new entry
    const newEntry = {
        reaction: reaction || 'neutral',
        notes: notes || '',
        date: new Date().toISOString().split('T')[0]
    };

    // Add the new entry to the array
    savedData.completedFoods[foodName].push(newEntry);

    // Add to food history
    const newFood = {
        id: Date.now(),
        name: foodName,
        category: Object.values(recommendedFoods)
            .flat()
            .find(food => food.name === foodName)?.category || 'other',
        reaction: newEntry.reaction,
        notes: newEntry.notes,
        date: newEntry.date,
        day: savedData.currentDay,
        isExpanded: true // New items start expanded
    };
    savedData.foods.push(newFood);
    savedData.currentDay = Math.min(savedData.currentDay + 1, 100);

    localStorage.setItem('babyFoodTracker', JSON.stringify(savedData));
    renderFoodGrid(savedData.completedFoods);
    renderFoodList(savedData.foods);
    updateProgress(savedData.currentDay);
}

// Render the food list
function renderFoodList(foods) {
    const foodList = document.getElementById('food-list');
    foodList.innerHTML = '';

    // Sort foods by date (newest first)
    foods.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group foods by date
    const groupedFoods = foods.reduce((groups, food) => {
        const date = food.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(food);
        return groups;
    }, {});

    // Render each date group
    Object.entries(groupedFoods).forEach(([date, dateFoods]) => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'food-log-date-group';

        // Convert UTC date string to local date for display
        const utcDate = new Date(date);
        const displayDate = utcDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        });

        // Create date header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'food-log-date-header';
        dateHeader.innerHTML = `<h4>${displayDate}</h4>`;

        // Create entries container
        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'food-log-entries';

        // Render each food item for this date
        dateFoods.forEach(food => {
            const foodElement = document.createElement('div');
            foodElement.className = `food-item ${food.reaction}`;
            
            // Check if this is a new item (from today)
            const today = new Date().toISOString().split('T')[0];
            const isNewItem = food.date === today;
            
            foodElement.innerHTML = `
                <div class="food-item-header">
                    <h4>${food.name}</h4>
                    <div class="food-item-actions">
                        <span class="reaction-emoji">${food.reaction === 'positive' ? '👍' : food.reaction === 'negative' ? '👎' : '😐'}</span>
                        <span class="date-text">Day ${food.day}</span>
                        <button class="edit-btn" title="Expand/Collapse">${food.isExpanded ? '▲' : '▼'}</button>
                    </div>
                </div>
                <div class="food-item-content" style="display: ${food.isExpanded ? 'block' : 'none'}">
                    <p><strong>Category:</strong> ${food.category}</p>
                    <div class="reaction-selector">
                        <strong>Reaction:</strong>
                        <div class="reaction-buttons">
                            <button class="reaction-btn ${food.reaction === 'positive' ? 'active' : ''}" data-reaction="positive">👍</button>
                            <button class="reaction-btn ${food.reaction === 'neutral' ? 'active' : ''}" data-reaction="neutral">😐</button>
                            <button class="reaction-btn ${food.reaction === 'negative' ? 'active' : ''}" data-reaction="negative">👎</button>
                        </div>
                    </div>
                    <div class="notes-container">
                        <strong>Notes:</strong>
                        <textarea class="notes" placeholder="Add notes...">${food.notes || ''}</textarea>
                    </div>
                    <div class="date-container">
                        <strong>Date:</strong>
                        <div class="date-display">
                            <span class="date-text editable">Day ${food.day} - ${displayDate}</span>
                            <input type="date" class="date-input" value="${food.date}" style="display: none;">
                        </div>
                    </div>
                    <div class="delete-container">
                        <button class="delete-btn" title="Delete">Delete Entry 🗑️</button>
                    </div>
                </div>
            `;

            // Handle reaction buttons
            const reactionButtons = foodElement.querySelectorAll('.reaction-btn');
            reactionButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const reaction = button.dataset.reaction;
                    reactionButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    updateFoodLogItem(food.id, { reaction });
                });
            });

            // Handle notes
            const notesTextarea = foodElement.querySelector('.notes');
            notesTextarea.addEventListener('change', () => {
                updateFoodLogItem(food.id, { notes: notesTextarea.value });
            });

            // Handle date editing
            const dateText = foodElement.querySelector('.date-container .date-text');
            const dateInputField = foodElement.querySelector('.date-input');
            
            dateText.addEventListener('click', () => {
                dateText.style.display = 'none';
                dateInputField.style.display = 'block';
                dateInputField.focus();
            });

            dateInputField.addEventListener('blur', () => {
                const newDate = new Date(dateInputField.value);
                if (!isNaN(newDate)) {
                    // Store the date in UTC
                    const utcDate = new Date(Date.UTC(
                        newDate.getUTCFullYear(),
                        newDate.getUTCMonth(),
                        newDate.getUTCDate()
                    ));
                    
                    // Format the date for display using local timezone
                    const displayDate = utcDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                    });
                    
                    // Calculate day difference based on the original date (converting to UTC)
                    const originalDate = new Date(food.date);
                    const originalUtcDate = new Date(Date.UTC(
                        originalDate.getUTCFullYear(),
                        originalDate.getUTCMonth(),
                        originalDate.getUTCDate()
                    ));
                    
                    const dayDiff = Math.floor((utcDate - originalUtcDate) / (1000 * 60 * 60 * 24));
                    const newDay = Math.max(1, food.day + dayDiff);
                    
                    // Update the display immediately
                    dateText.textContent = `Day ${newDay} - ${displayDate}`;
                    
                    // Store the UTC date string for internal use
                    const utcDateString = utcDate.toISOString().split('T')[0];
                    
                    // Update the food log item with the new date and day
                    updateFoodLogItem(food.id, { 
                        date: utcDateString,
                        day: newDay
                    });
                }
                dateText.style.display = 'inline';
                dateInputField.style.display = 'none';
            });

            dateInputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    dateInputField.blur();
                }
            });

            // Handle delete button
            const deleteBtn = foodElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this food entry?')) {
                    deleteFoodLogItem(food.id);
                }
            });

            // Handle edit button
            const editBtn = foodElement.querySelector('.edit-btn');
            const content = foodElement.querySelector('.food-item-content');
            
            // Set initial icon based on content visibility
            editBtn.textContent = content.style.display === 'none' ? '▼' : '▲';
            
            editBtn.addEventListener('click', () => {
                const isExpanded = content.style.display !== 'none';
                content.style.display = isExpanded ? 'none' : 'block';
                editBtn.textContent = isExpanded ? '▼' : '▲';
                updateFoodLogItem(food.id, { isExpanded: !isExpanded });
            });

            entriesContainer.appendChild(foodElement);
        });

        dateGroup.appendChild(dateHeader);
        dateGroup.appendChild(entriesContainer);
        foodList.appendChild(dateGroup);
    });
}

// Update a food log item
function updateFoodLogItem(foodId, updates) {
    const savedData = JSON.parse(localStorage.getItem('babyFoodTracker')) || {
        currentDay: 1,
        foods: [],
        completedFoods: {}
    };

    const foodIndex = savedData.foods.findIndex(food => food.id === foodId);
    if (foodIndex !== -1) {
        const food = savedData.foods[foodIndex];
        
        // Create a new food entry with updated values
        const updatedFood = {
            ...food,
            ...updates
        };
        
        // Update the food entry
        savedData.foods[foodIndex] = updatedFood;
        
        // Update the completedFoods entry
        if (!savedData.completedFoods[food.name]) {
            savedData.completedFoods[food.name] = [];
        }
        
        // Find the matching entry in completedFoods by date
        const entryIndex = savedData.completedFoods[food.name].findIndex(
            entry => entry.date === food.date
        );

        if (entryIndex !== -1) {
            // Update the existing entry
            const existingEntry = savedData.completedFoods[food.name][entryIndex];
            savedData.completedFoods[food.name][entryIndex] = {
                ...existingEntry,
                ...updates
            };
        } else {
            // Create a new entry
            savedData.completedFoods[food.name].push({
                reaction: updates.reaction || food.reaction || 'neutral',
                notes: updates.notes || food.notes || '',
                date: food.date
            });
        }

        // Recalculate day numbers for all foods based on earliest date
        if (savedData.foods.length > 0) {
            // Get all unique dates from food entries
            const uniqueDates = [...new Set(savedData.foods.map(f => f.date))].sort();
            const earliestDate = new Date(uniqueDates[0]);
            
            // Update day numbers for all foods
            savedData.foods.forEach(food => {
                const foodDate = new Date(food.date);
                const dayDiff = Math.floor((foodDate - earliestDate) / (1000 * 60 * 60 * 24));
                food.day = dayDiff + 1;
            });

            // Update current day based on the latest date
            const latestDate = new Date(uniqueDates[uniqueDates.length - 1]);
            const currentDayDiff = Math.floor((latestDate - earliestDate) / (1000 * 60 * 60 * 24));
            savedData.currentDay = currentDayDiff + 1;
        }

        // Save to localStorage
        localStorage.setItem('babyFoodTracker', JSON.stringify(savedData));
        
        // Re-render the lists
        renderFoodList(savedData.foods);
        renderFoodGrid(savedData.completedFoods);
        updateProgress(savedData.currentDay);
    }
}

// Delete a food log item
function deleteFoodLogItem(foodId) {
    const savedData = JSON.parse(localStorage.getItem('babyFoodTracker')) || {
        currentDay: 1,
        foods: [],
        completedFoods: {}
    };

    const foodIndex = savedData.foods.findIndex(food => food.id === foodId);
    if (foodIndex !== -1) {
        const food = savedData.foods[foodIndex];
        
        // Remove from foods array
        savedData.foods.splice(foodIndex, 1);
        
        // Remove the specific entry from completedFoods
        if (savedData.completedFoods[food.name]) {
            const entryIndex = savedData.completedFoods[food.name].findIndex(
                entry => entry.date === food.date
            );
            if (entryIndex !== -1) {
                savedData.completedFoods[food.name].splice(entryIndex, 1);
            }
            // If no entries left for this food, remove the food entry
            if (savedData.completedFoods[food.name].length === 0) {
                delete savedData.completedFoods[food.name];
            }
        }

        // Recalculate day numbers for remaining foods based on earliest date
        if (savedData.foods.length > 0) {
            // Get all unique dates from food entries
            const uniqueDates = [...new Set(savedData.foods.map(f => f.date))].sort();
            const earliestDate = new Date(uniqueDates[0]);
            
            // Update day numbers for all remaining foods
            savedData.foods.forEach(food => {
                const foodDate = new Date(food.date);
                const dayDiff = Math.floor((foodDate - earliestDate) / (1000 * 60 * 60 * 24));
                food.day = dayDiff + 1;
            });

            // Update current day based on the latest date
            const latestDate = new Date(uniqueDates[uniqueDates.length - 1]);
            const currentDayDiff = Math.floor((latestDate - earliestDate) / (1000 * 60 * 60 * 24));
            savedData.currentDay = currentDayDiff + 1;
        } else {
            // If no foods remain, reset current day to 1
            savedData.currentDay = 1;
        }

        localStorage.setItem('babyFoodTracker', JSON.stringify(savedData));
        renderFoodList(savedData.foods);
        renderFoodGrid(savedData.completedFoods);
        updateProgress(savedData.currentDay);
    }
}

// Add a food to the log
function addFoodToLog(food) {
    const savedData = JSON.parse(localStorage.getItem('babyFoodTracker')) || {
        currentDay: 1,
        foods: [],
        completedFoods: {}
    };

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Get all unique dates from existing foods
    const uniqueDates = [...new Set(savedData.foods.map(f => f.date))].sort();
    const earliestDate = uniqueDates.length > 0 ? new Date(uniqueDates[0]) : today;
    
    const dayDiff = Math.floor((today - earliestDate) / (1000 * 60 * 60 * 24));
    const dayNumber = dayDiff + 1;

    const newFood = {
        id: Date.now(),
        name: food.name,
        category: food.category,
        date: todayString,
        day: dayNumber,
        reaction: 'neutral',
        notes: '',
        isExpanded: true // New items start expanded
    };

    savedData.foods.push(newFood);
    savedData.currentDay = dayNumber;

    // Reset the food grid square's visual state by updating the latest entry
    if (savedData.completedFoods[food.name] && savedData.completedFoods[food.name].length > 0) {
        const latestEntry = savedData.completedFoods[food.name][savedData.completedFoods[food.name].length - 1];
        latestEntry.reaction = 'neutral';
        latestEntry.notes = '';
    }

    localStorage.setItem('babyFoodTracker', JSON.stringify(savedData));
    renderFoodList(savedData.foods);
    renderFoodGrid(savedData.completedFoods);
    updateProgress(savedData.currentDay);
}

// Update theme toggle button
function updateThemeToggle(theme) {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Simple encoding/decoding functions
function encodeData(data) {
    // Convert to base64
    return btoa(data);
}

function decodeData(encodedData) {
    try {
        // Decode from base64 and parse JSON
        const decodedString = atob(encodedData);
        return JSON.parse(decodedString);
    } catch (error) {
        console.error('Decode error:', error);
        return null;
    }
}

// Handle data export
function exportData() {
    const savedData = localStorage.getItem('babyFoodTracker');
    const encodedData = encodeData(savedData);
    const subject = 'Baby Food Tracker Data Backup';
    const body = encodeURIComponent(encodedData);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// Handle data import
function importData() {
    const input = document.createElement('textarea');
    input.style.position = 'fixed';
    input.style.top = '50%';
    input.style.left = '50%';
    input.style.transform = 'translate(-50%, -50%)';
    input.style.width = '80%';
    input.style.height = '200px';
    input.style.padding = '20px';
    input.style.boxSizing = 'border-box';
    input.style.border = '2px solid var(--primary-color)';
    input.style.borderRadius = 'var(--radius-md)';
    input.style.zIndex = '1000';
    input.placeholder = 'Paste your backup data here and press Enter to import, or Escape to cancel';

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '999';

    document.body.appendChild(overlay);
    document.body.appendChild(input);
    input.focus();

    function cleanup() {
        document.body.removeChild(input);
        document.body.removeChild(overlay);
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            try {
                const decodedData = decodeData(input.value);
                if (decodedData && typeof decodedData === 'object') {
                    localStorage.setItem('babyFoodTracker', JSON.stringify(decodedData));
                    cleanup();
                    window.location.reload();
                } else {
                    alert('Invalid data format. Please check your data and try again.');
                }
            } catch (error) {
                alert('Invalid data format. Please check your data and try again.');
            }
        } else if (e.key === 'Escape') {
            cleanup();
        }
    });
} 