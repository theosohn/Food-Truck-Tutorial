import {updateText} from "./utils/updateText.js";
import {updateData} from "./utils/updateData.js";

export function startMemoryGame(numOfPeople, numOfFoodTrucks, mapContainer, custom='', onSuccess, attempts=0) {
    const adjustedFoodTrucks = numOfFoodTrucks > 0 ? numOfFoodTrucks : 1;
    const customersPerTruck = Math.floor(numOfPeople / adjustedFoodTrucks);
    const sequenceLength = Math.min(3 + Math.floor(customersPerTruck / 10), 6);

    const possibleItems = [
        { name: 'Taco', image: 'images/taco.svg' },
        { name: 'Burger', image: 'images/burger.svg' },
        { name: 'Hot Dog', image: 'images/hotdog.svg' },
        { name: 'Pizza', image: 'images/pizza.svg' },
        { name: 'Ice Cream', image: 'images/ice-cream.svg' },
        { name: 'Soda', image: 'images/soda.svg' },
        { name: 'Coffee', image: 'images/coffee.svg' }
    ];

    /* const maxSequenceLength = Math.min(sequenceLength, possibleItems.length);
    const shuffledItems = [...possibleItems].sort(() => 0.5 - Math.random());
    const sequence = shuffledItems.slice(0, maxSequenceLength); */
    let temp = [];
    for (let i = 0; i < custom.length; i++) {
        temp.push(possibleItems[parseInt(custom.charAt(i))]);
    }
    const sequence = temp;
    
    // Adding solution to data
    let data = 'solution[';
    for (let i = 0; i < sequence.length; i++) {
        data += sequence[i].name + ',';
    }
    data = data.slice(0, -1);
    data += '],player[';

    // Sequence display area
    const sequenceDisplay = document.createElement('div');
    sequenceDisplay.id = 'sequence-display';

    // Player input buttons container
    const inputContainer = document.createElement('div');
    inputContainer.id = 'input-container';

    // Append elements to overlay
    mapContainer.appendChild(sequenceDisplay);
    mapContainer.appendChild(inputContainer);

    // Display the sequence to the player
    let displayIndex = 0;
    function displayNextItem() {
        if (displayIndex < sequence.length) {
            // Clear previous display
            sequenceDisplay.innerHTML = '';

            // Create an image for the current item
            const itemImage = document.createElement('img');
            itemImage.src = sequence[displayIndex].image;
            itemImage.alt = sequence[displayIndex].name;
            itemImage.classList.add('sequence-item');

            // Append the image to the display area
            sequenceDisplay.appendChild(itemImage);

            displayIndex++;
            setTimeout(displayNextItem, 2000);
        } else {
            // After displaying the sequence, clear the display
            sequenceDisplay.innerHTML = '';
            // Show the input buttons
            showInputButtons();
        }
    }
    displayNextItem();

    // Function to show input buttons
    function showInputButtons() {
        const startTime = Date.now();
        let timestamps = '';
        inputContainer.innerHTML = '';
        const playerSequence = [];

        // Shuffle the possible items before displaying them
        const shuffledPossibleItems = [...possibleItems].sort(() => 0.5 - Math.random());

        shuffledPossibleItems.forEach(item => {
            const button = document.createElement('button');
            button.classList.add('input-button');

            const buttonImage = document.createElement('img');
            buttonImage.src = item.image;
            buttonImage.alt = item.name;
            buttonImage.classList.add('input-item');

            button.appendChild(buttonImage);

            button.addEventListener('click', () => {
                playerSequence.push(item);
                // Adding participant actions to data, storing timestamps
                data += item.name + ',';
                timestamps += (Date.now() - startTime).toString() + ',';
                // Provide visual feedback
                button.classList.add('selected');

                // Check if the player's sequence is complete
                if (playerSequence.length === sequence.length) {
                    // Adding timestamps to data, saving data
                    data = data.slice(0, -1);
                    timestamps = timestamps.slice(0, -1);
                    data += '],timestamps[' + timestamps + '],';
                    updateData(data);
                    // Check if the sequences match
                    if (sequencesMatch(playerSequence, sequence)) {
                        // Success: remove overlay and proceed
                        sequenceDisplay.remove();
                        inputContainer.remove();
                        onSuccess(attempts);
                        return;
                    } else {
                        sequenceDisplay.remove();
                        inputContainer.remove();
                        attempts++;

                        // Failure: alert and restart minigame
                        if (attempts >= 4) {
                            onSuccess(attempts);
                            return;
                        }

                        alert('Incorrect sequence. Please try again.');
                        startMemoryGame(numOfPeople, numOfFoodTrucks, mapContainer, custom, onSuccess, attempts);
                    }
                }
            });

            inputContainer.appendChild(button);
        });
    }

    // Helper function to compare sequences
    function sequencesMatch(seq1, seq2) {
        if (seq1.length !== seq2.length) return false;
        for (let i = 0; i < seq1.length; i++) {
            if (seq1[i].name !== seq2[i].name) return false;
        }
        return true;
    }
}
    