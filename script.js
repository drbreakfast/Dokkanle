let cards = [];
let currentCard = null;
let passiveParts = [];
let passiveIndex = 0;
let revealStage = 0; // Tracks which part to reveal next
let currentMode = 'daily'; // Default mode
let strikes = 5; // Initialize the strike counter
let dailyCompleted = false; // Flag to track if the daily card was completed
let unlimitedStreak = 0;

async function loadCards() {
    try {
        const response = await fetch('data/dokkan_cards.json');
        cards = await response.json();
        console.log('Cards loaded')
        console.log(cards.length)
        initializeGame();
    } catch (error) {
        console.error('Error loading card data:', error);
    }
}

loadCards();

// Initialize the game mode
function initializeGame() {
    // Check if cards have been loaded
    if (!cards.length) {
        console.error('No cards available. Ensure cards are loaded correctly.');
        return;
    }
    // Set initial mode
    setMode('daily');
}

// Load progress from localStorage when the page loads
function loadProgress() {
    const savedCard = localStorage.getItem('dailyCard');
    const savedStrikes = localStorage.getItem('strikes');
    const savedCompleted = localStorage.getItem('dailyCompleted');
    const savedPassiveIndex = localStorage.getItem('passiveIndex');
    const savedRevealStage = localStorage.getItem('revealStage');

    if (savedCard) {
        const date = new Date().toISOString().split('T')[0];
        const seed = parseInt(date.split('-').join(''), 10);
        const index = seed % cards.length;
        if(savedCard == JSON.stringify(cards[index])){
            strikes = savedStrikes ? parseInt(savedStrikes, 10) : 5;
            dailyCompleted = savedCompleted === 'true';
            passiveIndex = savedPassiveIndex ? parseInt(savedPassiveIndex, 10) : 0;
            revealStage = savedRevealStage ? parseInt(savedRevealStage, 10) : 0;
        }else{
            strikes = 5;
            dailyCompleted = false;
            passiveIndex = 0;
            revealStage = 0;
        }
        currentCard = cards[index];
        
        
        if(strikes < 5){
            document.getElementById('feedback').textContent = `Strikes remaining: ${strikes}`;
        }
        const passive = currentCard.ezaPassive || currentCard.passive || 'No passive information available';
        passiveParts = passive.split(';');
        
        if (dailyCompleted) {
            document.getElementById('feedback').innerHTML = `You have already completed today's challenge.<br><br>The card is: ${currentCard.title + " - " + currentCard.name}`;
            revealAllInfo();
            document.querySelector('button[onclick="nextCard()"]').style.display = 'none';
            return;
        }else{
            updateClue();
            if(passiveIndex == passiveParts.length - 1){
                revealStage--;
                revealMore();
            }
        }
    } else {
        pickDailyCard(); // If no progress, start fresh
    }
}

// Save current progress to localStorage
function saveProgress() {
    if (currentCard) {
        localStorage.setItem('dailyCard', JSON.stringify(currentCard));
    }
    localStorage.setItem('strikes', strikes);
    localStorage.setItem('dailyCompleted', dailyCompleted);
    localStorage.setItem('passiveIndex', passiveIndex);
    localStorage.setItem('revealStage', revealStage);
}

function setMode(mode) {
    // Select buttons
    const dailyButton = document.querySelector('.game-mode-button:nth-child(1)');
    const unlimitedButton = document.querySelector('.game-mode-button:nth-child(2)');

    // Remove the selected class from both buttons
    dailyButton.classList.remove('selected');
    unlimitedButton.classList.remove('selected');

    // Add the selected class to the current mode button
    if (mode === 'daily') {
        dailyButton.classList.add('selected');
        loadProgress();
        document.querySelector('button[onclick="nextCard()"]').style.display = 'none';
        if(currentMode == 'unlimited'){
            unlimitedStreak = 0;
            document.getElementById('streak').style.display = 'none';
        }
    } else if (mode === 'unlimited') {
        unlimitedButton.classList.add('selected');
        pickNewCard();
    }

    // Update current mode
    currentMode = mode;
}

function pickDailyCard() {
    // Check if cards have been loaded
    if (!cards.length) {
        console.error('No cards available to pick.');
        return;
    }
    
    // Use a date-based seed to ensure the same card is picked for all users on the same day
    const date = new Date().toISOString().split('T')[0];
    const seed = parseInt(date.split('-').join(''), 10);
    const index = seed % cards.length;
    
    currentCard = cards[index];

    if (!currentCard) {
        console.error('Current card is undefined.');
        return;
    }
    
    // Handle cases where `ezaPassive` might be undefined
    const passive = currentCard.ezaPassive || currentCard.passive || 'No passive information available';
    passiveParts = passive.split(';');
    passiveIndex = 0;
    revealStage = 0;
    updateClue();
}

// Pick a new card randomly
function pickNewCard() {
    resetGame();
    strikes = 5;
    currentCard = cards[Math.floor(Math.random() * cards.length)];
    const passive = currentCard.ezaPassive || currentCard.passive;
    passiveParts = passive.split(';');
    passiveIndex = 0;
    revealStage = 0;
    updateClue();
}

// Handle completion of Daily mode
function handleDailyCompletion() {
    if (currentMode === 'daily') {
        document.querySelector('button[onclick="nextCard()"]').style.display = 'none';
        dailyCompleted = true;
        saveProgress(); // Save progress
    }
}

// Update clue display
function updateClue() {
    let displayedPassive = passiveParts.slice(0, passiveIndex + 1).join(';');
    if (passiveIndex < passiveParts.length - 1) {
        displayedPassive += '...'; // Add ellipsis if there is more to reveal
    }
    document.getElementById('clue').textContent = displayedPassive;
}

// Reset game state
function resetGame() {
    document.getElementById('guess').value = '';
    document.getElementById('clue').textContent = 'Loading...';
    document.getElementById('feedback').textContent = '';
    document.getElementById('rarity-image').style.display = 'none';
    document.getElementById('type-image').style.display = 'none';
    document.getElementById('class-info').textContent = '???';
    document.getElementById('leader-info').textContent = '???';
    document.getElementById('card-image').style.display = 'none';
    document.getElementById('rarity-temp').style.display = 'block';
    document.getElementById('type-temp').style.display = 'block';
    
    // Show "Give Up", "Reveal More", "Submit Guess" buttons, and the input textbox
    document.querySelector('button[onclick="giveUp()"]').style.display = 'inline-block';
    document.querySelector('button[onclick="revealMore()"]').style.display = 'inline-block';
    document.querySelector('button[onclick="submitGuess()"]').style.display = 'inline-block';
    document.getElementById('guess').style.display = 'inline-block';
    
    // Stop showing "Next" button
    document.querySelector('button[onclick="nextCard()"]').style.display = 'none';
}

function submitGuess() {
    const guessInput = document.getElementById('guess');
    const userGuess = guessInput.value.trim().toLowerCase();

    // Check if the guess is correct
    if (userGuess === currentCard.name.toLowerCase()) {
        document.getElementById('feedback').textContent = `Correct! The card is: ${currentCard.title + " - " + currentCard.name}`;
        if(currentMode == 'unlimited'){
            unlimitedStreak++;
            document.getElementById('streak').textContent = `Unlimited Streak: ${unlimitedStreak}`;
            document.getElementById('streak').style.display = 'inline-block';
        }
        // Reset strikes for the next round if needed
        strikes = 5;
        revealAllInfo();
        handleDailyCompletion();
        return;
    } else {
        // Incorrect guess, decrement strikes
        strikes--;
        if(currentMode === 'daily'){
            saveProgress(); // Save progress
        }
        
        // Check if strikes have run out
        if (strikes <= 0) {
            document.getElementById('feedback').textContent = `Out of strikes! The card was: ${currentCard.title + " - " + currentCard.name}`;
            if(currentMode == 'unlimited'){
                unlimitedStreak = 0;
                document.getElementById('streak').style.display = 'none';
            }
            giveUp(); // Function to reveal the card
        } else {
            document.getElementById('feedback').textContent = `Incorrect! ${strikes} strikes remaining.`;
        }
    }

    // Clear the input field for the next guess
    guessInput.value = '';
}

// Reveal more information step-by-step
function revealMore() {
    if(revealStage > 3){
        document.getElementById('feedback').textContent = "Nothing left to reveal.";
        return;
    }

    if (passiveIndex < passiveParts.length - 1) {
        // Reveal more of the passive
        passiveIndex++;
        updateClue();
    } else {
        // Reveal other information sequentially after the passive is fully revealed
        revealStage++;
        switch (revealStage) {
            case 1:
                document.getElementById('rarity-image').src = `images/rarity_${currentCard.rarity}.png`;
                document.getElementById('rarity-image').style.display = 'block';
                document.getElementById('rarity-temp').style.display = 'none';
                break;
            case 2:
                document.getElementById('rarity-image').src = `images/rarity_${currentCard.rarity}.png`;
                document.getElementById('rarity-image').style.display = 'block';
                document.getElementById('rarity-temp').style.display = 'none';
                document.getElementById('class-info').textContent = currentCard.class;
                break;
            case 3:
                document.getElementById('rarity-image').src = `images/rarity_${currentCard.rarity}.png`;
                document.getElementById('rarity-image').style.display = 'block';
                document.getElementById('rarity-temp').style.display = 'none';
                document.getElementById('class-info').textContent = currentCard.class;
                document.getElementById('type-image').src = `images/${currentCard.type}_icon.png`;
                document.getElementById('type-image').style.display = 'block';
                document.getElementById('type-temp').style.display = 'none';
                break;
            case 4:
                document.getElementById('rarity-image').src = `images/rarity_${currentCard.rarity}.png`;
                document.getElementById('rarity-image').style.display = 'block';
                document.getElementById('rarity-temp').style.display = 'none';
                document.getElementById('class-info').textContent = currentCard.class;
                document.getElementById('type-image').src = `images/${currentCard.type}_icon.png`;
                document.getElementById('type-image').style.display = 'block';
                document.getElementById('type-temp').style.display = 'none';
                document.getElementById('leader-info').textContent = currentCard.ezaLeaderSkill || currentCard.leaderSkill || 'No Leader Skill';
                break;
            default:
                break;
        }
    }
    if(currentMode === 'daily'){
        saveProgress(); // Save progress
    }
    
}

// Give up function to reveal the answer
function giveUp() {
    if(currentMode == 'unlimited'){
        unlimitedStreak = 0;
        document.getElementById('streak').style.display = 'none';
    }
    document.getElementById('feedback').textContent = `The answer was: ${currentCard.title + " - " + currentCard.name}`;
    revealAllInfo();
    handleDailyCompletion(); // Check if in daily mode and handle completion
}

function revealAllInfo() {
    document.getElementById('clue').textContent = passiveParts.join(';');
    document.getElementById('rarity-image').src = `images/rarity_${currentCard.rarity}.png`;
    document.getElementById('rarity-image').style.display = 'block';
    document.getElementById('rarity-temp').style.display = 'none';
    document.getElementById('class-info').textContent = currentCard.class;
    document.getElementById('type-image').src = `images/${currentCard.type}_icon.png`;
    document.getElementById('type-image').style.display = 'block';
    document.getElementById('type-temp').style.display = 'none';
    document.getElementById('leader-info').textContent = currentCard.ezaLeaderSkill || currentCard.leaderSkill || 'No Leader Skill';
    document.getElementById('card-image').src = currentCard.imageURL;
    document.getElementById('card-image').style.display = 'block';

    // Hide "Give Up", "Reveal More", "Submit Guess" buttons, and the input textbox
    document.querySelector('button[onclick="giveUp()"]').style.display = 'none';
    document.querySelector('button[onclick="revealMore()"]').style.display = 'none';
    document.querySelector('button[onclick="submitGuess()"]').style.display = 'none';
    document.getElementById('guess').style.display = 'none';
    
    // Make "Next" button bigger
    document.querySelector('button[onclick="nextCard()"]').style.display = 'inline-block';
    document.querySelector('button[onclick="nextCard()"]').classList.add('large-next-button');
}

// Function to load the next card
function nextCard() {
    pickNewCard();
}

// Add event listener to the input textbox
document.getElementById('guess').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission if inside a form
        submitGuess(); // Trigger the submit guess function
    }
});

// Function to filter and sort card names based on input
function getSuggestions(input) {
    const searchTerm = input.toLowerCase();

    // Filter cards based on the input
    const filteredCards = cards.filter(card => card.name.toLowerCase().includes(searchTerm));

    // Sort cards by name, prioritizing exact matches first
    filteredCards.sort((a, b) => {
        const inputLower = searchTerm;
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();

        // Prioritize exact matches first
        const aStartsWith = aName.startsWith(inputLower);
        const bStartsWith = bName.startsWith(inputLower);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // If both or neither are exact matches, sort alphabetically
        return aName.localeCompare(bName);
    });

    return filteredCards;
}

function displaySuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('suggestions');
    suggestionsContainer.innerHTML = ''; // Clear existing suggestions

    suggestions.forEach(card => {
        const div = document.createElement('div');
        div.classList.add('suggestion-item');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        
        // Create image element
        const img = document.createElement('img');
        img.src = card.imageURL;
        img.alt = card.name;
        img.style.width = '50px'; // Adjust size as needed
        img.style.height = 'auto';
        img.style.marginRight = '8px'; // Space between image and text

        // Create display text for suggestions
        const displayText = document.createElement('span');
        displayText.textContent = card.name;

        // Create additional info text
        const additionalInfo = document.createElement('span');
        additionalInfo.textContent = `: ${card.title}`;
        additionalInfo.style.color = '#888'; // Gray color for additional info

        div.appendChild(img);
        div.appendChild(displayText);
        div.appendChild(additionalInfo);

        div.onclick = () => {
            document.getElementById('guess').value = card.name;
            suggestionsContainer.innerHTML = ''; // Clear suggestions after selection
        };
        suggestionsContainer.appendChild(div);
    });

    // Hide suggestions if there are none
    suggestionsContainer.style.display = suggestions.length ? 'block' : 'none';
}

// Event listener for input changes
document.getElementById('guess').addEventListener('input', function() {
    const input = this.value;
    if (input) {
        const suggestions = getSuggestions(input);
        displaySuggestions(suggestions);
    } else {
        document.getElementById('suggestions').style.display = 'none';
    }
});

// Hide suggestions when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.matches('#guess')) {
        document.getElementById('suggestions').style.display = 'none';
    }
});

// Modal functionality
const rulesButton = document.getElementById('rules-button');
const rulesModal = document.getElementById('rules-modal');
const closeModal = document.querySelector('.close');

rulesButton.onclick = function() {
    rulesModal.style.display = 'block';
}

closeModal.onclick = function() {
    rulesModal.style.display = 'none';
}

// Click outside of modal to close
window.onclick = function(event) {
    if (event.target === rulesModal) {
        rulesModal.style.display = 'none';
    }
}

function showRules() {
    if(document.getElementById('rules-popup').style.display == 'flex'){
        closeRules();
    }else{
        document.getElementById('rules-popup').style.display = 'flex';
    }
}

function closeRules() {
    document.getElementById('rules-popup').style.display = 'none';
}
