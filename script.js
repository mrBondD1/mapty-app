'use strict';



// Selecting all elements
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const resetBtn = document.querySelector('.reset');


class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;      //[lat, lan]
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }


};

// Running Object
class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();

    }


    calcPace() {
        this.pace = this.duration / this.distance;
        this.pace
    }
};

// Cycling Object
class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this._setDescription();

    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        this.speed
    }
};




///////////////////////////////////////////////////
/// Application Architecture

class App {

    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workOuts = [];

    constructor() {
        // Get user's position
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        // Atttach event handlers
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition() {
        navigator.geolocation?.getCurrentPosition(this._loadMap.bind(this), function () {
            alert('Could not get your position!')
        });
    };

    _loadMap(position) {

        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(latitude, longitude);

        const coords = [latitude, longitude];

        // Using Leaflet API
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Handling clicks on map
        this.#map.on('click', this._showForm.bind(this));

        // Getting the marker from local storage
        this.#workOuts.forEach(work => this._renderWorkoutMarker(work));
    };

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    };

    _hideForm() {

        //Empty the form
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);

    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    };

    _newWorkout(e) {

        // Check if data is valid
        const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const checkPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;



        // If workout running , create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;

            if (!validInput(distance, duration, cadence) || !checkPositive(distance, duration, cadence))
                return swal("ERROR!", "Inputs have to be positive numbers!", "error");

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // If workout cycling , create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            if (!validInput(distance, duration, elevation) || !checkPositive(distance, duration))
                return swal("ERROR!", "Inputs have to be positive numbers!", "error");

            workout = new Cycling([lat, lng], distance, duration, elevation);

        }

        // Add new object to workout array
        this.#workOuts.push(workout);
        console.log(this.#workOuts);


        // Render workout on map as marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);

        // Hide form + Clear input fields
        this._hideForm();

        // Set local storage for all workouts
        this._setLocalStorage();

    };

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            })).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }

    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;

        if (workout.type === 'running') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🐱‍🏍</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
            `;
        }
        if (workout.type === 'cycling') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> 
            `;
        }
        form.insertAdjacentHTML('afterend', html);

    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return workoutEl;

        const workout = this.#workOuts.find(work => work.id === workoutEl.dataset.id);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            }
        });

    };

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workOuts));
    };

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));

        if (!data) return;

        this.#workOuts = data;
        this.#workOuts.forEach(work => this._renderWorkout(work));
    }


};

const newFeature = function(){
    console.log('New features added!');
}

// Creating Object from class
const app = new App();

// reseting workouts

resetBtn.addEventListener('click', function (e) {
    swal({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover your workouts!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
    })
        .then((willDelete) => {
            if (willDelete) {
                localStorage.removeItem('workouts');
                location.reload();
            } else {
                swal("Your workout history is safe!");
            }
        });

});
