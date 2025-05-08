import { randomInteger } from "../utils/randomInteger.js";
import { hide } from "../utils/hide.js";
import { show } from "../utils/show.js";
import { updateText } from "../utils/updateText.js";
import { updateData } from "../utils/updateData.js";
import { Park } from "./park.js";
import { startMemoryGame } from "../memoryGame.js";

export class GameState {

    constructor (randomize, hints=[], numOfParks=4, numOfDays=5, numOfHours=8, numOfPeople=[], numOfFoodTrucks=[], customMemoryGame=[], hintAccuracy=0, hintIndices=[]) {
        this.randomize = randomize;
        this.numOfParks = numOfParks;
        this.numOfDays = numOfDays;
        this.numOfHours = numOfHours;
        this.currentPark = null;
        this.profits = 0;
        this.parks = [];    
        this.currentDay = 0;
        this.currentHour = 0;
        this.qualtricsString = '';
        this.prevTime = 0;
        this.hints = hints;
        this.hintAccuracy = hintAccuracy;
        this.hintIndices = hintIndices;
        this.seenHints = "hints[";
        this.dayListItems = {};
        this.eventLists = {};
        this.relativeTime = Date.now();
        this.parkDecisions = "parks[";
        this.parkTimestamps = "parkTimes[";
        this.truckFlows = "truckFlows[";
        this.sProfits = "profits[";

        for (let i = 0; i < numOfParks; i++) {
            let newPark;

            if (randomize) {
                newPark = new Park(randomize, numOfDays, numOfHours);
            } else {
                newPark = new Park(randomize, numOfDays, numOfHours, numOfPeople[i], numOfFoodTrucks[i]);
            }

            this.parks.push(newPark);
        }
        this.customMemoryGame = customMemoryGame;
        this.currentPark = this.parks[0];
        this.currentParkNum = 0;
        this.createMenu();
    }

    getDayAndHour(shift) {
        const hour = Math.min(this.numOfDays * this.numOfHours - 1, Math.max(0,this.currentDay * this.numOfHours + this.currentHour + shift));
        const dayHour = [Math.floor(hour / this.numOfHours), hour % this.numOfHours];
        return dayHour;
    }

    displayNumberOfMovingTrucks(isArriving) {
        const observationTextContainer = document.getElementById('observation-text-container');
        const observationDescriptionText = document.getElementById('observation-description-text');
        const arrivalText = document.getElementById('arrival-text');
        const departureText = document.getElementById('departure-text');
        const peopleText = document.getElementById('number-of-people');
        const foodText = document.getElementById('number-of-food-trucks');

        if ((this.currentDay == 0 && this.currentHour == 0) || (this.numOfHours - this.currentHour == 0) || this.currentDay < 0 || this.currentHour < 0) {
            hide(observationTextContainer);
            return;
        }

        const currNumOfFoodTrucks = this.currentPark.getNumOfFoodTrucks(this.currentDay, this.currentHour);
        let otherFoodTrucks;

        if (isArriving) {
            const dayHour = this.getDayAndHour(-1);
            otherFoodTrucks = this.currentPark.getNumOfFoodTrucks(dayHour[0], dayHour[1]);
        } else {
            const dayHour = this.getDayAndHour(1);
            otherFoodTrucks = this.currentPark.getNumOfFoodTrucks(dayHour[0], dayHour[1]);
        }
        
        let numOfArrivingFoodTrucks = 0;
        let numOfLeavingFoodTrucks = 0;
        let diff = otherFoodTrucks - currNumOfFoodTrucks;

        /*if (isArriving) {
            diff *= -1;
            observationDescriptionText.textContent = "As you arrive at the park you notice the following:";
        } else {
            observationDescriptionText.textContent = "As you decide where to go next you notice the following:";
        }*/

        if (diff < 0) {
            numOfLeavingFoodTrucks = diff * -1;
        }
        if (diff > 0) {
            numOfArrivingFoodTrucks = diff;
        }

        peopleText.textContent = "Trucks Arriving at Park: " + numOfArrivingFoodTrucks;
        foodText.textContent = "Trucks Leaving Park: " + numOfLeavingFoodTrucks;
        this.truckFlows += "a" + numOfArrivingFoodTrucks + "l" + numOfLeavingFoodTrucks + ',';
    }

    // Creates the game's menu
    createMenu() {
        const hintText = document.getElementById('hint');
        const mapContainer = document.getElementById('map');
        //const profitGainsText = document.getElementById('profit-gains');
        const historyContainer = document.getElementById('history-container');

        // Create history header
        const historyContainerHeader = document.createElement('h2');
        historyContainerHeader.textContent = "History:";
        historyContainer.appendChild(historyContainerHeader);

        // Create history list
        const historyList = document.createElement('ul');
        historyList.id = 'history-list';
        historyContainer.appendChild(historyList);

        // Create decision header
        const buttonContainerHeader = document.createElement('h2');
        buttonContainerHeader.textContent = "Choose which park to travel to...";
        mapContainer.appendChild(buttonContainerHeader);

        // Create arriving and leaving text
        const observationTextContainer = document.createElement('div');
        observationTextContainer.id = 'observation-text-container'
        const observationDescriptionText = document.createElement('p');
        observationDescriptionText.id = 'observation-description-text'
        const arrivalText = document.createElement('p');
        arrivalText.id = 'arrival-text';
        const departureText = document.createElement('p');
        departureText.id = 'departure-text';
        mapContainer.appendChild(observationTextContainer);
        observationTextContainer.appendChild(observationDescriptionText);
        observationTextContainer.appendChild(arrivalText);
        observationTextContainer.appendChild(departureText);
        show(observationTextContainer);

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'button-container';
        mapContainer.appendChild(buttonContainer);

        // Create start minigame button
        const startMinigameButton = document.createElement('button');
        buttonContainer.appendChild(startMinigameButton);
        startMinigameButton.textContent = 'Begin serving food!';
        startMinigameButton.id = 'minigame-start-button';
        hide(startMinigameButton);
        
        // Create continue button
        const continueButton = document.createElement('button');
        continueButton.id = 'continue-button';
        continueButton.textContent = 'Start a new day!';
        hide(continueButton);
        mapContainer.appendChild(continueButton);

        // Creates Park buttons
        for (let i = 0; i < this.numOfParks; i++) {
            let button = document.createElement("button");
            buttonContainer.appendChild(button);     
            button.textContent = this.parks[i].name;
            button.classList.add('park-button');

            let image = document.createElement("image");
            image.classList.add('park-icon');
            button.appendChild(image);

            button.addEventListener("click", () =>  {
                // Update current park
                this.currentPark = this.parks[i];
                this.currentParkNum = i;
                this.parkDecisions += (i+1).toString() + ",";
                this.parkTimestamps += (Date.now() - this.relativeTime).toString() + ',';
                this.displayNumberOfMovingTrucks(true);
                
                const allParkButtons = document.querySelectorAll('.park-button');
                allParkButtons.forEach(button => {
                    hide(button);
                });

                buttonContainerHeader.textContent = "Arriving at " + this.currentPark.name;
                updateText('current-park', this.currentPark.name);
                updateText('number-of-people', `Number of Customers: ${this.currentPark.getNumOfPeople(this.currentDay, this.currentHour)}`);
                updateText('number-of-food-trucks', `Number of Food Trucks: ${this.currentPark.getNumOfFoodTrucks(this.currentDay, this.currentHour)}`);
                //show(observationTextContainer);
                show(startMinigameButton);
            })
        }

        // Creates Continue button
        continueButton.addEventListener("click", () => {
            if (this.nextDay()) {
                //hide(profitGainsText);
                show(buttonContainerHeader);
                show(buttonContainer);
                hide(continueButton);
                const allParkButtons = document.querySelectorAll('.park-button');
                allParkButtons.forEach(button => {
                    show(button);
                });
                this.relativeTime = Date.now();
            } else {
                hide(continueButton);
            }
        })

        startMinigameButton.addEventListener("click", () => {
            hide(startMinigameButton);
            hide(observationTextContainer);
            buttonContainerHeader.textContent = "Memorize the customer's orders...";

            // Get number of customers at this park, current day and hour
            const numOfPeople = this.currentPark.getNumOfPeople(this.currentDay, this.currentHour);
            const numOfFoodTrucks = this.currentPark.getNumOfFoodTrucks(this.currentDay, this.currentHour);

            startMemoryGame(numOfPeople, numOfFoodTrucks, mapContainer, this.customMemoryGame[this.currentParkNum][this.currentDay][this.currentHour], (attempts) => {
                this.generateProfit(this.currentDay, this.currentHour, attempts);
                buttonContainerHeader.textContent = "Decision for the next hour:";
                this.generateHint();
                //show(profitGainsText);
                show(hintText);

                this.displayNumberOfMovingTrucks(false);
                show(observationTextContainer);
                this.currentHour++;
                // Start of a new day
                if (this.currentHour >= this.numOfHours) {
                    hide(observationTextContainer);
                    hide(buttonContainerHeader);
                    hide(buttonContainer);
                    //hide(hintText);
                    updateText("hint", "N/A");
                    if (this.currentDay == this.numOfDays - 1) {
                        updateText('continue-button', 'End game')
                    }
                    show(continueButton);
                } else {
                    this.seenHints += hintText.textContent + ",";
                }
                updateText('current-day', this.currentDay + 1);
                updateText('remaining-hours', this.numOfHours - this.currentHour);
                const allParkButtons = document.querySelectorAll('.park-button');
                allParkButtons.forEach(button => {
                    show(button);
                });
                this.relativeTime = Date.now();
            })
        })
    }

    // Returns true when there is a new day and false otherwise
    nextDay() {
        this.currentHour = 0;
        this.currentDay++;

        // End of the game
        if (this.currentDay >= this.numOfDays) {
            this.endGame();
            return false;
        }

        updateText('current-park', 'Home');
        updateText('number-of-people', 'Number of Customers: 0');
        updateText('number-of-food-trucks', 'Number of Food Trucks: 0');
        updateText('current-day', this.currentDay + 1);
        updateText('remaining-hours', this.numOfHours - this.currentHour);

        return true;
    }

    generateProfit(day=this.currentDay, hour=this.currentHour, attempts) {
        const historyList = document.getElementById('history-list');
        const numOfPeople = this.currentPark.getNumOfPeople(day, hour);
        const numOfFoodTrucks = this.currentPark.getNumOfFoodTrucks(day, hour);
        const numOfCustomers = Math.max(1, /*randomInteger(-2, 4) +*/Math.ceil(numOfPeople / (numOfFoodTrucks + 1)));
        
        let profitsFromHour = numOfCustomers * 10/*randomInteger(8, 25)*/;
        profitsFromHour -= profitsFromHour * 0.25 * attempts;
        this.sProfits += "" + profitsFromHour + ',';
        this.profits += profitsFromHour;

        // Format the event text
        const eventText = `H${this.currentHour + 1}: Profited $${profitsFromHour} at ${this.currentPark.name}. There were ${numOfPeople} people and ${numOfFoodTrucks} trucks.`;

        // Manage history entries
        let dayNumber = this.currentDay + 1;
        let dayListItem = this.dayListItems[dayNumber];

        if (!dayListItem) {
            // Create a new main bullet point for the day
            dayListItem = document.createElement('li');
            dayListItem.textContent = `Day ${dayNumber}`;

            // Create a sub-list for events under this day
            let eventList = document.createElement('ul');
            dayListItem.appendChild(eventList);

            // Insert the day list item at the top of the history list
            historyList.insertBefore(dayListItem, historyList.firstChild);

            // Store references
            this.dayListItems[dayNumber] = dayListItem;
            this.eventLists[dayNumber] = eventList;
        }

        // Create a new event list item
        const eventListItem = document.createElement('li');
        eventListItem.textContent = eventText;

        // Insert the event at the top of the day's event list
        const eventList = this.eventLists[dayNumber];
        eventList.insertBefore(eventListItem, eventList.firstChild);

        // Scroll to the top of the history container
        const historyContainer = document.getElementById('history-container');
        historyContainer.scrollTop = 0;

        updateText('current-park', this.currentPark.name);
        //updateText('profit-gains', `You gained $${profitsFromHour}`);
        updateText('current-profit', this.profits);
        updateText('number-of-people', `Number of Customers: ${numOfPeople}`);
        updateText('number-of-food-trucks', `Number of Food Trucks: ${numOfFoodTrucks}`);
    }

    endGame() {
        updateData(this.parkDecisions.slice(0,-1) + "],");
        updateData(this.parkTimestamps.slice(0,-1) + "],");
        updateData(this.seenHints.slice(0,-1) + "],");
        updateData(this.truckFlows.slice(0,-1) + "],");
        updateData(this.sProfits.slice(0,-1) + "]");
        updateData('End');
        updateText('current-park', 'GAME OVER');
        updateText('number-of-people', 'Thanks for playing!');
        updateText('number-of-food-trucks', 'Please do not leave the site yet.');
        //updateText('profit-gains', '');
        const endInstructions = document.getElementById('endInstructions');
        show(endInstructions);
        const qualtricsString = document.getElementById('qualtricsString');
        show(qualtricsString);
    }

    generateHint() {
        if (this.randomize) {
            var index = randomInteger(0, this.hints.length - 1);
        } else {
            var index = this.currentDay * this.numOfHours + this.currentHour;
        }
        if (this.hintIndices.length != 0) {
            if (this.hintIndices.includes(index + 1) && this.currentHour < this.numOfHours - 1) {
                this.randomHint();
            } else {
                updateText("hint", "N/A");
            }
        } else {
            updateText("hint", this.hints[index]);
        }
    }

    randomHint() {
        var day = this.currentDay + Math.floor((this.currentHour + 1) / this.numOfHours);
        var hour = (this.currentHour + 1) % this.numOfHours;
        var index = 0;
        var max = Math.max(1, Math.ceil(this.parks[index].getNumOfPeople(day, hour) / (this.parks[index].getNumOfFoodTrucks(day, hour) + 1)));
        for (let i = 1; i < this.numOfParks; i++) {
            let temp = Math.max(1, Math.ceil(this.parks[i].getNumOfPeople(day, hour) / (this.parks[i].getNumOfFoodTrucks(day, hour) + 1)));
            if (temp > max) {
                max = temp;
                index = i;
            }
        }
        if (Math.random() < this.hintAccuracy) {
            updateText("hint", "Try Park " + (index + 1).toString());
        } else {
            index = (index + 1) % this.numOfParks;
            updateText("hint", "Try Park " + (index + 1).toString());
        }
    }
}
