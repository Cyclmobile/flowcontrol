document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firestore
  const db = firebase.firestore();

  // Define variables
  let locationUpdateInterval;
  const updateInterval = 500; // update location every 500 milliseconds

  // Fetch floorsData from Firestore for all companies and start location updates
  function fetchFloorsDataAndStartUpdates() {
    db.collection("companies")
      .get()
      .then((querySnapshot) => {
        let allFloorsData = [];
        querySnapshot.forEach((doc) => {
          const floorsData = doc.data().floorsData;
          allFloorsData = allFloorsData.concat(floorsData); // Aggregate floors from all companies
        });
        populateFloorDropdown(allFloorsData);
        if (allFloorsData.length > 0) {
          startLocationUpdates(allFloorsData[0].floor); // Start updates for the first floor in the aggregated list
        }
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);
      });
  }

  // Function to populate floor dropdown with available options
  function populateFloorDropdown(floorsData) {
    const floorSelect = document.getElementById("floor-select");
    floorSelect.innerHTML = ""; // Clear existing options

    // Create a Set to store unique floor numbers
    const uniqueFloors = new Set();

    floorsData.forEach((floorData) => {
      uniqueFloors.add(floorData.floor); // Add floor number to the Set
    });

    // Create dropdown options from the unique floor numbers
    uniqueFloors.forEach((floor) => {
      const option = document.createElement("option");
      option.value = floor;
      option.textContent = `Floor ${floor}`;
      floorSelect.appendChild(option);
    });
  }

  // Function to start location updates for the selected floor
  function startLocationUpdates(floorNumber) {
    // Clear existing interval
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
    }

    // Fetch and display the initial location for the new floor immediately
    locateUserAndDisplay(floorNumber);

    // Set up a new interval for the new floor
    locationUpdateInterval = setInterval(function () {
      locateUserAndDisplay(floorNumber);
    }, updateInterval);
  }

  // Function to locate user and display UI for the selected floor
  function locateUserAndDisplay(floorNumber) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          updateUIForFloor(userCoords, floorNumber);
        },
        () => {
          alert("Unable to access your location.");
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  // Function to update UI for the selected floor
  function updateUIForFloor(userCoords, floorNumber) {
    const floorsData = []; // Define an empty array to store fetched floorsData

    db.collection("companies")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const companyFloorsData = doc.data().floorsData;
          const floorData = companyFloorsData.find(
            (floor) => floor.floor === floorNumber
          );
          if (floorData) {
            floorsData.push(floorData);
          }
        });
        const areasWithDistance = floorsData[0].areas.map((area) => ({
          ...area,
          distance: calculateDistance(userCoords, area.coords),
        }));
        updateUI(areasWithDistance);
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);
      });
  }

  // Function to update UI based on areas and distance
  function updateUI(areas) {
    const mainLightContainer = document.getElementById("main-light");
    const otherLightsContainer = document.getElementById("other-lights");
    mainLightContainer.innerHTML = "";
    otherLightsContainer.innerHTML = "";

    // Sort areas based on distance in ascending order
    areas.sort((a, b) => a.distance - b.distance);

    areas.forEach((area, index) => {
      const lightElement = document.createElement("div");
      lightElement.className =
        "traffic-light " + (index === 0 ? "main" : "smaller");
      const colorAndStatus = getColorAndStatus(area.distance, area.radius);
      lightElement.innerHTML = `<div class="light" style="background-color: ${colorAndStatus.color};"></div>
                                          <span>${area.name}: ${colorAndStatus.status}</span>`;

      if (index === 0) {
        mainLightContainer.appendChild(lightElement);
      } else {
        // Always append the lights to the right
        lightElement.style.order = index;
        otherLightsContainer.appendChild(lightElement);
        lightElement.addEventListener("click", function () {
          swapWithMainLight(index);
        });
      }
    });
  }

  // Function to handle floor change
  document
    .getElementById("floor-select")
    .addEventListener("change", function () {
      startLocationUpdates(parseInt(this.value, 10));
    });

  // Function to calculate distance between two coordinates (in meters)
  function calculateDistance(coords1, coords2) {
    const R = 6371e3; // meters
    const φ1 = (coords1.lat * Math.PI) / 180;
    const φ2 = (coords2.latitude * Math.PI) / 180;
    const Δφ = ((coords2.latitude - coords1.lat) * Math.PI) / 180;
    const Δλ = ((coords2.longitude - coords1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Function to get color and status based on distance and radius
  function getColorAndStatus(distance, radius) {
    if (distance < radius) {
      return { color: "green", status: "Very Close or Inside" };
    } else if (distance <= 20) {
      return { color: "yellow", status: `Close (${Math.round(distance)} M)` };
    } else if (distance <= 300) {
      return { color: "red", status: `Nearby (${Math.round(distance)} M)` };
    } else {
      return { color: "grey", status: `Far (${Math.round(distance)} M)` };
    }
  }

  // Initialize updates for the default floor when the page loads
  fetchFloorsDataAndStartUpdates();
});
