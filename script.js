"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const deleteAllBtn = document.querySelector(".delete__all__btn");
const sortBtn = document.querySelector(".btn__sort");
let editBtn;
let allWorkouts;

class Workout {
  date = new Date();
  id = (Date.now() + " ").slice(-10);
  clicks = 0;
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  // click() {
  //   this.clicks++;
  // }
}

class Running extends Workout {
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.type = "running";
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.type = "cycling";
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  workouts = [];
  markers = [];
  #mapzoomLevel = 13;
  sortedState = false;

  constructor() {
    this._editingWorkout = null;
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    containerWorkouts.addEventListener("click", (e) => {
      if (e.target.closest(".edit__btn")) this._updateWorkout(e);
    });
    containerWorkouts.addEventListener("click", (e) => {
      if (e.target.closest(".delete__btn")) this._deleteWorkout(e);
    });
    deleteAllBtn.addEventListener("click", this._deleteAllWorkout.bind(this));
    sortBtn.addEventListener("click", this._sortWorkouts.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Location could not got");
        }
      );
  }

  _loadMap(position) {
    // console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    // console.log(
    //   `https://www.google.com/maps/@${latitude},${longitude},16z?entry=ttu&g_ep=EgoyMDI1MDUxMi4wIKXMDSoASAFQAw%3D%3D`
    // );
    this.#map = L.map("map").setView(coords, this.#mapzoomLevel);
    // console.log(map);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
    this.workouts.forEach((workout) => this._renderWorkoutMarker(workout));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // console.log(markerEvent);
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm = function () {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        " ";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  };

  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    if (this._editingWorkout) {
      // workoutEl.style.display = "none";
      const workoutEl = document.querySelector(
        `[data-id="${this._editingWorkout.id}"]`
      );
      workoutEl.style.display = "none";

      // Update existing workout
      this._editingWorkout.type = inputType.value;
      this._editingWorkout.distance = +inputDistance.value;
      this._editingWorkout.duration = +inputDuration.value;

      if (inputType.value === "running") {
        this._editingWorkout.cadence = +inputCadence.value;
        this._editingWorkout.calcPace();
      } else {
        this._editingWorkout.elevationGain = +inputElevation.value;
        this._editingWorkout.calcSpeed();
      }

      this._editingWorkout._setDescription();

      // Re-render list and map markers
      this._hideForm();
      this._setLocalStorage();
      this._renderList(this._editingWorkout);
      // this._renderWorkoutMarker(this._editingWorkout);

      this._editingWorkout = null; // Clear edit mode
    } else {
      const type = inputType.value;
      const distance = +inputDistance.value;
      const duration = +inputDuration.value;
      const { lat, lng } = this.#mapEvent.latlng;
      let workout;

      const validInputs = (...para) => para.every((p) => Number.isFinite(p));
      const checkPositive = (...para) => para.every((p) => p > 0);

      if (type === "running") {
        const cadence = +inputCadence.value;
        if (
          !validInputs(distance, duration, cadence) ||
          !checkPositive(distance, duration, cadence)
        ) {
          console.log(this.workouts);

          return alert("Inputs have to be a positive number");
        }
        workout = new Running(distance, duration, [lat, lng], cadence);
      }
      if (type === "cycling") {
        const elevation = +inputElevation.value;
        if (
          !validInputs(distance, duration, elevation) ||
          !checkPositive(distance, duration)
        ) {
          return alert("Inputs have to be a positive number");
        }
        workout = new Cycling(distance, duration, [lat, lng], elevation);
      }
      deleteAllBtn.classList.remove("hidden");
      sortBtn.classList.remove("hidden");
      this.workouts.push(workout);
      this._renderWorkoutMarker(workout);
      this._hideForm();
      this._renderList(workout);
      this._setLocalStorage();
    }
  }

  _renderWorkoutMarker(workout) {
    // console.log(lat, lng);
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
    this.markers.push(marker);
    console.log(this.markers);
  }

  _renderList(workout) {
    const html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <div class="workout__header">
        <h2 class="workout__title">${workout.description}</h2>
        <button class="edit__btn">
          <img class="edit__icon" src="edit (1).png" alt="edit workout button" />
        </button>
        <button class="delete__btn">
          <img
      class="delete__icon"
      src="delete (1).png"
      alt="delete workout button"
          />
        </button>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.type === "running" ? workout.pace.toFixed(1) : workout.speed.toFixed(1)}</span>
        <span class="workout__unit">${workout.type === "running" ? "min/km" : "km/h"}</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === "running" ? "🦶🏼" : "⛰"}</span>
        <span class="workout__value">${workout.type === "running" ? workout.cadence : workout.elevationGain}</span>
        <span class="workout__unit">${workout.type === "running" ? "spm" : "m"}</span>
      </div>
    </li>`;

    form.insertAdjacentHTML("afterend", html);
    // editBtn = document.querySelector(".edit__btn");
    // console.log(editBtn);
    // editBtn.addEventListener("click", this._updateWorkout.bind(this));
    allWorkouts = document.querySelectorAll(".workout");
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    // console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    console.log(workout);

    this.#map.setView(workout.coords, this.#mapzoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    console.log(data);

    data.forEach((work) => {
      console.log(work);
      let workout;
      if (work.type === "running") {
        workout = new Running(
          work.distance,
          work.duration,
          work.coords,
          work.cadence
        );
      }
      if (work.type === "cycling") {
        workout = new Cycling(
          work.distance,
          work.duration,
          work.coords,
          work.elevationGain
        );
      }
      workout.date = new Date(work.date);

      workout.id = work.id;
      this.workouts.push(workout);
      this._renderList(workout);
      deleteAllBtn.classList.remove("hidden");
      sortBtn.classList.remove("hidden");
    });
  }

  clearLocalStorage() {
    localStorage.clear("workouts");
  }

  _updateWorkout(e) {
    e.preventDefault();
    const workoutEl = e.target.closest(".workout");
    // console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );
    // console.log(workout);
    this._editingWorkout = workout;
    form.classList.remove("hidden");
    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;

    if (workout.type === "running") {
      inputCadence.value = workout.cadence;
      inputElevation.closest(".form__row").classList.add("form__row--hidden");
      inputCadence.closest(".form__row").classList.remove("form__row--hidden");
    } else if (workout.type === "cycling") {
      inputElevation.value = workout.elevationGain;
      inputCadence.closest(".form__row").classList.add("form__row--hidden");
      inputElevation
        .closest(".form__row")
        .classList.remove("form__row--hidden");
    }

    inputDistance.focus();
  }

  _deleteWorkout(e) {
    e.preventDefault();
    const workoutEl = e.target.closest(".workout");
    console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    this.workouts = this.workouts.filter((work) => work.id !== workout.id);
    workoutEl.style.display = "none";
    console.log(workout.coords);
    const remMarker = this.markers.filter(
      (marker) =>
        marker._latlng.lat === workout.coords[0] &&
        marker._latlng.lng === workout.coords[1]
    );
    remMarker[0].remove();
    // Reset local Storage
    this._setLocalStorage();
  }

  _deleteAllWorkout(e) {
    e.preventDefault();

    console.log(allWorkouts);
    allWorkouts.forEach((workout) => (workout.style.display = "none"));
    this.markers.forEach((marker) => marker.remove());
    deleteAllBtn.classList.add("hidden");
    sortBtn.classList.add("hidden");

    this.workouts = [];
    this._setLocalStorage();
  }

  _sortWorkouts(e) {
    if (!this.sortedState) {
      e.preventDefault();
      const sortedWorkouts = [...this.workouts].sort(
        (work1, work2) => work1.distance - work2.distance
      );
      allWorkouts.forEach((workout) => (workout.style.display = "none"));
      sortedWorkouts.forEach((workout) => this._renderList(workout));
      this.sortedState = true;
    } else {
      allWorkouts.forEach((workout) => (workout.style.display = "none"));
      this.workouts.forEach((workout) => this._renderList(workout));
      this.sortedState = false;
    }
  }
}

const app = new App();
// app._sortWorkout();
// const run1 = new Running(10, 20, [78, -23], 15);
// const cycling1 = new Cycling(20, 30, [78, -23], 25);

// console.log(run1, cycling1);
// const id = (Date.now() + " ").slice(-10);
// console.log(Date.now() + " ");
// console.log(id);

// console.log(new Date("2025-06-04T16:40:56.554Z").getDate());
