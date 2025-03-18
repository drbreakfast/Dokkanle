let cards = [];
let currentCard = null;
let passiveParts = [];
let passiveIndex = 0;
let revealStage = 0; // Tracks which part to reveal next
let currentMode = 'daily'; // Default mode
let strikes = 5; // Initialize the strike counter
let dailyCompleted = false; // Flag to track if the daily card was completed
let unlimitedStreak = 0;
let basePath = window.location.pathname.includes('/daily/') || 
window.location.pathname.includes('/unlimited/') ||
window.location.pathname.includes('/info/') ? '../' : '';
let inSuggestions = false

async function loadCards() {
    try {
        // Determine the base path relative to the current page
        
        // Fetch the card data using the appropriate path
        const response = await fetch(basePath + 'data/card_data.json');
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        cards = await response.json();
        console.log('Cards loaded:', cards.length);

        // Extract images (assuming each card has an "image" property)
        let images = cards.map(card => card["Images"]["card_thumb_character"]);

        // Shuffle images
        images = shuffleArray(images);

        const backgroundContainer = document.getElementById("scrollingBackground");
        backgroundContainer.innerHTML = ""; // Clear previous content

        const rows = 15; // Number of rows
        const imagesPerRow = 10

        // Create a wrapper for each row
        const rowWrapper = document.createElement("div");
        rowWrapper.classList.add("scrolling-wrapper");

        for (let i = 0; i < rows; i++) {
            const row = document.createElement("div");
            row.classList.add("scrolling-row");
            if (i % 2 === 0) row.classList.add("reverse"); // Alternate direction

            let rowImages = images.slice(i * imagesPerRow, (i + 1) * imagesPerRow);

            // Add images to row
            rowImages.forEach(src => {
                const img = document.createElement("img");
                img.src = src;
                img.alt = "Dokkan Card";
                row.appendChild(img);
            });

            // Duplicate images for seamless scrolling
            rowImages.forEach(src => {
                const img = document.createElement("img");
                img.src = src;
                img.alt = "Dokkan Card";
                row.appendChild(img);
            });

            rowWrapper.appendChild(row);
        }

        // Append the row wrapper to the background container
        backgroundContainer.appendChild(rowWrapper);

        initializeGame();
    } catch (error) {
        console.error('Error loading card data:', error);
    }
}

// Shuffle array helper function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Load images when the page loads
window.onload = loadCards;

// Initialize the game mode
function initializeGame() {
    if (!cards.length) {
        console.error('No cards available. Ensure cards are loaded correctly.');
        return;
    }

    if(window.location.pathname.includes('/daily/')){
        setMode('daily');
    }else if(window.location.pathname.includes('/unlimited/')){
        setMode('unlimited');
    }
    
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
            document.getElementById('feedback').innerHTML = `Strikes remaining: ${strikes}`;
        }
        const passive = currentCard["Passive Skill"];
        passiveParts = [];
        let firstLine = true;

        for (const [key, value] of Object.entries(passive)) {
            const parts = value.split('. ').map(part => part.trim()).filter(part => part);

            if (parts.length > 0) {
                if (firstLine) {
                    passiveParts.push(`<span class="bold-key">${key}</span> <br>• ${parts[0]}`);
                    firstLine = false;
                } else {
                    passiveParts.push(`<br><span class="bold-key">${key}</span> <br>• ${parts[0]}`);
                }
            }

            for (let i = 1; i < parts.length; i++) {
                passiveParts.push(`• ${parts[i]}`);
            }
        }
        
        if (dailyCompleted) {
            document.getElementById('feedback').innerHTML = `You have already completed today's challenge.<br><br>The card is: ${currentCard["Title"] + " - " + currentCard["Name"]}`;
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


// Function to trigger a reflow and adjust the layout
function updateScrollingRows() {
    const scrollingWrapper = document.querySelector('#scrollingBackground');
    const pageHeightInVh = (document.documentElement.scrollHeight / window.innerHeight) * 100;
    //console.log(pageHeightInVh)
    scrollingWrapper.style.height = `${pageHeightInVh-5}vh`; 
}

document.addEventListener('click', () => {
    updateScrollingRows(); // Call the update function on click
});
document.addEventListener('scroll', () => {
    updateScrollingRows(); // Call the update function on click
});

// Get the current page path (without query parameters)
let path = window.location.pathname.replace("/Website", "");  

// Define a mapping of URLs to nav link IDs
const navMap = {
    "/index.html": "nav-home",
    "/": "nav-home",  // This handles when users visit just the domain
    "/daily/": "nav-daily",
    "/unlimited/": "nav-unlimited",
    "/info/": "nav-info"
};

// Get the corresponding nav link ID
const activeNavId = navMap[path];

// Apply the "active" class if the ID exists
if (activeNavId) {
    document.getElementById(activeNavId).classList.add("active");
}

function setMode(mode) {
    // Add the selected class to the current mode button
    if (mode === 'daily') {
        resetGame();
        loadProgress();
        document.querySelector('button[onclick="nextCard()"]').style.display = 'none';
        if(currentMode == 'unlimited'){
            unlimitedStreak = 0;
            document.getElementById('streak').style.display = 'none';
        }
    } else if (mode === 'unlimited') {
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
    const passive = currentCard["Passive Skill"];
    passiveParts = [];
    let firstLine = true;

    for (const [key, value] of Object.entries(passive)) {
        const parts = value.split('. ').map(part => part.trim()).filter(part => part);

        if (parts.length > 0) {
            if (firstLine) {
                passiveParts.push(`<span class="bold-key">${key}</span> <br>• ${parts[0]}`);
                firstLine = false;
            } else {
                passiveParts.push(`<br><span class="bold-key">${key}</span> <br>• ${parts[0]}`);
            }
        }

        for (let i = 1; i < parts.length; i++) {
            passiveParts.push(`• ${parts[i]}`);
        }
    }
    passiveIndex = 0;
    revealStage = 0;
    updateClue();
}

// Pick a new card randomly
function pickNewCard() {
    //Reset scroll background
    const scrollingWrapper = document.querySelector('#scrollingBackground');
    scrollingWrapper.style.height = `100vh`;

    resetGame();
    strikes = 5;
    currentCard = cards[Math.floor(Math.random() * cards.length)];
    const passive = currentCard["Passive Skill"];
    passiveParts = [];
    let firstLine = true;

    for (const [key, value] of Object.entries(passive)) {
        const parts = value.split('. ').map(part => part.trim()).filter(part => part);

        if (parts.length > 0) {
            if (firstLine) {
                passiveParts.push(`<span class="bold-key">${key}</span> <br>• ${parts[0]}`);
                firstLine = false;
            } else {
                passiveParts.push(`<br><span class="bold-key">${key}</span> <br>• ${parts[0]}`);
            }
        }

        for (let i = 1; i < parts.length; i++) {
            passiveParts.push(`• ${parts[i]}`);
        }
    }
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
    let displayedPassive = passiveParts.slice(0, passiveIndex + 1).join('\n');
    if (passiveIndex < passiveParts.length - 1) {
        displayedPassive += '\n...'; // Add ellipsis if there is more to reveal
    }
    document.getElementById('clue').innerHTML = displayedPassive;
}

// Reset game state
function resetGame() {
    document.getElementById('guess').value = '';
    document.getElementById('clue').innerHTML = 'Loading...';
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('rarity-image').style.display = 'none';
    document.getElementById('type-image').style.display = 'none';
    document.getElementById('leader-info').innerHTML = '???';
    document.getElementById('card-image').style.display = 'none';
    document.getElementById('card-rarity').style.display = 'none';
    document.getElementById('card-type').style.display = 'none';
    document.getElementById('background-image').style.display = 'none';
    document.getElementById('image-container').style.display = 'none';
    document.getElementById('rarity-temp').style.display = 'block';
    document.getElementById('type-temp').style.display = 'block';
    document.getElementById('streak-feedback').style.display = 'none';

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
    if (userGuess === currentCard["Name"].toLowerCase()) {
        document.getElementById('feedback').innerHTML = `Correct! The card is: ${currentCard["Title"] + " - " + currentCard["Name"]}`;
        if(currentMode == 'unlimited'){
            unlimitedStreak++;
            if(unlimitedStreak > 1){
                document.getElementById('streak').innerHTML = `Unlimited Streak: ${unlimitedStreak}`;
                document.getElementById('streak').style.display = 'inline-block';
            }
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
            document.getElementById('feedback').innerHTML = `Out of strikes! The card was: ${currentCard["Title"] + " - " + currentCard["Name"]}`;
            giveUp(); // Function to reveal the card
        } else {
            document.getElementById('feedback').innerHTML = `Incorrect! ${strikes} strikes remaining.`;
        }
    }

    // Clear the input field for the next guess
    guessInput.value = '';
}

// Reveal more information step-by-step
function revealMore() {
    if(revealStage > 2){
        document.getElementById('feedback').innerHTML = "Nothing left to reveal.";
        return;
    }else{
        //updateScrollingRows()
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
                document.getElementById('rarity-image').src = currentCard["Images"]["card_rarity"];
                document.getElementById('rarity-image').style.display = 'block';
                document.getElementById('rarity-temp').style.display = 'none';
                break;
            case 2:
                document.getElementById('rarity-image').src = currentCard["Images"]["card_rarity"];
                document.getElementById('rarity-image').style.display = 'block';
                document.getElementById('rarity-temp').style.display = 'none';
                document.getElementById('type-image').src = currentCard["Images"]["card_element"];
                document.getElementById('type-image').style.display = 'block';
                document.getElementById('type-temp').style.display = 'none';
                break;
            case 3:
                document.getElementById('rarity-image').src = currentCard["Images"]["card_rarity"];
                document.getElementById('rarity-image').style.display = 'block';
                document.getElementById('rarity-temp').style.display = 'none';
                document.getElementById('type-image').src = currentCard["Images"]["card_element"];
                document.getElementById('type-image').style.display = 'block';
                document.getElementById('type-temp').style.display = 'none';
                document.getElementById('leader-info').textContent = currentCard["Leader Skill"];
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
        document.getElementById('streak').style.display = 'none';
        if(unlimitedStreak > 1){
            document.getElementById('streak-feedback').style.display = 'block';
            document.getElementById('streak-feedback').innerHTML = `Your streak was: ${unlimitedStreak}`;
        }
        unlimitedStreak = 0;
    }
    document.getElementById('feedback').innerHTML = `The answer was: ${currentCard["Title"] + " - " + currentCard["Name"]}`;
    revealAllInfo();
    handleDailyCompletion(); // Check if in daily mode and handle completion
}

function revealAllInfo() {
    document.getElementById('clue').innerHTML = passiveParts.join('\n');
    document.getElementById('rarity-image').src = currentCard["Images"]["card_rarity"];
    document.getElementById('rarity-image').style.display = 'block';
    document.getElementById('rarity-temp').style.display = 'none';
    document.getElementById('type-image').src = currentCard["Images"]["card_element"];
    document.getElementById('type-image').style.display = 'block';
    document.getElementById('type-temp').style.display = 'none';
    document.getElementById('leader-info').innerHTML = currentCard["Leader Skill"];
    document.getElementById('background-image').src = currentCard["Images"]["card_thumb_bg"];
    document.getElementById('background-image').style.display = 'block';
    document.getElementById('card-image').src = currentCard["Images"]["card_thumb_character"];
    document.getElementById('card-image').style.display = 'block';
    document.getElementById('card-rarity').src = currentCard["Images"]["card_rarity"];
    document.getElementById('card-rarity').style.display = 'block';
    document.getElementById('card-type').src = currentCard["Images"]["card_element"];
    document.getElementById('card-type').style.display = 'block';
    document.getElementById('image-container').style.display = 'block';

    // Hide "Give Up", "Reveal More", "Submit Guess" buttons, and the input textbox
    document.querySelector('button[onclick="giveUp()"]').style.display = 'none';
    document.querySelector('button[onclick="revealMore()"]').style.display = 'none';
    document.querySelector('button[onclick="submitGuess()"]').style.display = 'none';
    document.getElementById('guess').style.display = 'none';
    
    // Make "Next" button bigger
    document.querySelector('button[onclick="nextCard()"]').style.display = 'inline-block';
    document.querySelector('button[onclick="nextCard()"]').classList.add('large-next-button');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Function to load the next card
function nextCard() {
    pickNewCard();
}

// Add event listener to the input textbox
if(basePath != ''){
    document.getElementById('guess').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission if inside a form
            submitGuess(); // Trigger the submit guess function
        }
    });
}

// Function to filter and sort card names based on input
function getSuggestions(input) {
    const searchTerm = input.toLowerCase();

    // Filter cards based on the input
    const filteredCards = cards.filter(card => card["Name"].toLowerCase().includes(searchTerm));

    // Sort cards by name, prioritizing exact matches first
    filteredCards.sort((a, b) => {
        const inputLower = searchTerm;
        const aName = a["Name"].toLowerCase();
        const bName = b["Name"].toLowerCase();

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
    inSuggestions = true
    const suggestionsContainer = document.getElementById('suggestions');
    suggestionsContainer.innerHTML = ''; // Clear existing suggestions

    suggestions.forEach(card => {
        const div = document.createElement('div');
        div.classList.add('suggestion-item');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        
        /*
        // Create image element
        const img = document.createElement('img');
        img.src = card["Images"]["card_thumb_character"];
        img.alt = card["Name"];
        img.style.width = '50px'; // Adjust size as needed
        img.style.height = 'auto';
        img.style.marginRight = '8px'; // Space between image and text
        */

        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '50px'; 
        container.style.height = '50px'; // Match the size of the images
        container.style.marginRight = '8px'; // Space between image and text
        container.style.left = '-25px';

        // Create first image (background)
        const img1 = document.createElement('img');
        img1.src = card["Images"]["card_thumb_bg"];
        img1.alt = card["Name"];
        img1.style.width = '100%';
        img1.style.height = '100%';
        img1.style.position = 'absolute';

        // Create second image (icon)
        const img2 = document.createElement('img');
        img2.src = card["Images"]["card_thumb_character"];
        img2.alt = 'Overlay Icon';
        img2.style.width = '125%';
        img2.style.height = '125%';
        img2.style.position = 'absolute';
        img2.style.top = '-8px';
        img2.style.left = '19px';

        // Create third image (rarity)
        const img3 = document.createElement('img');
        img3.src = card["Images"]["card_rarity"];
        img3.alt = 'Overlay Icon';
        img3.style.height = '60%';
        img3.style.position = 'absolute';
        img3.style.top = '26px';
        img3.style.left = '9px';

        // Create third image (type)
        const img4 = document.createElement('img');
        img4.src = card["Images"]["card_element"];
        img4.alt = 'Overlay Icon';
        img4.style.width = '45%';
        img4.style.height = '45%';
        img4.style.position = 'absolute';
        img4.style.top = '-7px';
        img4.style.left = '61px';


        // Create display text for suggestions
        const displayText = document.createElement('span');
        displayText.innerHTML = card["Name"];

        // Create additional info text
        const additionalInfo = document.createElement('span');
        additionalInfo.innerHTML = `: ${card["Title"]}`;
        additionalInfo.style.color = '#888'; // Gray color for additional info
        
        container.appendChild(img1);
        container.appendChild(img2);
        container.appendChild(img3);
        container.appendChild(img4);
        div.appendChild(container);
        //div.appendChild(img);
        div.appendChild(displayText);
        div.appendChild(additionalInfo);

        div.onclick = () => {
            document.getElementById('guess').value = card["Name"];
            suggestionsContainer.innerHTML = ''; // Clear suggestions after selection
            document.querySelector('#scrollingBackground').style.height=`100vh`;
            inSuggestions = false
            suggestionsContainer.style.display = 'none';
        };
        suggestionsContainer.appendChild(div);
    });

    // Hide suggestions if there are none
    suggestionsContainer.style.display = suggestions.length ? 'block' : 'none';

}

// Event listener for input changes
if(basePath != ''){
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
        if (!event.target.matches('#guess') && inSuggestions) {
            document.getElementById('suggestions').style.display = 'none';
            document.querySelector('#scrollingBackground').style.height=`100vh`;
            inSuggestions = false
        }
    });
}