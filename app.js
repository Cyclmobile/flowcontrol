document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firestore
  const db = firebase.firestore();

  // Define variables
  let locationUpdateInterval;
  const updateInterval = 500; // update location every 500 milliseconds
  // Define floorsData including extra companies, minimum 2 floors, and at least 2 areas on second floors
  const floorsData = [
    {
      companyId: "company11",
      floorsData: [
        {
          floor: 1,
          areas: [
            {
              name: "Second Floor Area 1",
              coords: { lat: 55.644, lng: 9.642 },
              radius: 20,
              ads: {
                message: "Special Offer just for you!",
                image: "https://example.com/special-offer.jpg", // This field is optional
              },
            },
            // Add more areas for company1 if needed
            {
              name: "Example Area 2",
              coords: { lat: 55.642, lng: 9.646 },
              radius: 15,
            },
            {
              name: "Example Area 3",
              coords: { lat: 55.641, lng: 9.644 },
              radius: 18,
            },
          ],
        },
        {
          floor: 2,
          areas: [
            {
              name: "Second Floor Area 1 hoes",
              coords: { lat: 55.644, lng: 9.642 },
              radius: 20,
            },
            // Add more areas for the second floor of company1 if needed
            {
              name: "Second Floor Area 2",
              coords: { lat: 55.648, lng: 9.643 },
              radius: 16,
            },
          ],
        },
      ],
    },

    // Add more companies as examples
  ];

  // Write floorsData to Firestore
  function writeFloorsDataToFirestore() {
    floorsData.forEach((company) => {
      db.collection("companies")
        .doc(company.companyId)
        .set(company)
        .then(() => {
          console.log("Company data successfully written!");
        })
        .catch((error) => {
          console.error("Error writing company data: ", error);
        });
    });
  }

  mapboxgl.accessToken =
    "pk.eyJ1IjoiZGluaTQ1OTMiLCJhIjoiY2x2Y3RnMDQ4MG1ycTJxcDdtNDNidG5yaiJ9.SpLsM8BXLF4Ia1Yhhsxylg"; // Replace with your Mapbox access token
  const map = new mapboxgl.Map({
    container: "mapbox-map", // container ID
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: "mapbox://styles/mapbox/streets-v12", // style URL
    center: [9.645873501926303, 55.643828986581525], // starting center in [lng, lat]
    zoom: 11, // starting zoom
  });

  // Add geolocate control to the map.
  // Add geolocate control to the map.
  const geolocateControl = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    // When active the map will receive updates to the device's location as it changes.
    trackUserLocation: true,
    // Draw an arrow next to the location dot to indicate which direction the device is heading.
    showUserHeading: true,
  });
  map.addControl(geolocateControl);

  map.on("load", function () {
    // Trigger current location when map is loaded
    geolocateControl.trigger();
  });

  let currentMarkers = []; // Store current markers for easy removal

  function addMarkersForFloor(areas, map) {
    removeCurrentMarkers(); // Clear existing markers before adding new ones
    areas.forEach((area) => {
      // Create a custom DOM element for the marker
      var el = document.createElement("div");
      el.innerHTML = `
      <div class="marker-icon" style="background-image: url('/mywaymarker.png');"></div>
      <div class="marker-label">${area.name}</div>
    `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([area.coords.lng, area.coords.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setText(
            area.name + (area.ads ? ` - ${area.ads.message}` : "")
          )
        )
        .addTo(map);
      currentMarkers.push(marker); // Store marker reference for removal later
    });
  }

  function removeCurrentMarkers() {
    currentMarkers.forEach((marker) => marker.remove()); // Remove each marker from the map
    currentMarkers = []; // Reset the array after removal
  }

  // Function to find the closest company based on user coordinates
  function findClosestCompany(userCoords) {
    db.collection("companies")
      .get()
      .then((querySnapshot) => {
        let closestCompanyDocId = null;
        let closestDistance = Infinity;
        let closestCompanyFloorsData = [];

        querySnapshot.forEach((doc) => {
          const companyData = doc.data();
          if (companyData && companyData.floorsData) {
            companyData.floorsData.forEach((floorData) => {
              const firstFloorCoords = floorData.areas.find(
                (area) => area.coords && area.coords.lat && area.coords.lng
              ).coords;
              const distance = calculateDistance(userCoords, firstFloorCoords);

              if (distance < closestDistance) {
                closestDistance = distance;
                closestCompanyDocId = doc.id;
                closestCompanyFloorsData = companyData.floorsData;
              }
            });
          }
        });

        if (closestCompanyDocId) {
          populateFloorDropdown(closestCompanyFloorsData, closestCompanyDocId);
          // Start location updates for the first floor of the closest company
          startLocationUpdates(0, closestCompanyDocId); // Assuming the first floor index is always 0
          fetchFloorDataAndAddMarkers(0, closestCompanyDocId); // Add markers for the first floor immediately
        }
      })
      .catch((error) => {
        console.error("Error getting documents: ", error);
      });
  }

  // Function to fetch floorsData for the closest company and start location updates
  function fetchClosestCompanyAndStartUpdates() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          findClosestCompany(userCoords);
        },
        () => {
          console.log("Unable to access your location.");
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0,
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }

  // Function to populate floor dropdown with available options
  function populateFloorDropdown(floorsData, companyName) {
    const floorSelect = document.getElementById("floor-select");
    floorSelect.innerHTML = ""; // Clear existing options

    floorsData.forEach((floorData, index) => {
      const option = document.createElement("option");
      option.value = index; // The index in the floorsData array
      option.textContent = `Floor ${floorData.floor}`;
      option.dataset.companyName = companyName; // Store the company document ID
      floorSelect.appendChild(option);
    });
  }

  // Function to start location updates for the selected floor
  function startLocationUpdates(floorNumber, docID) {
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
    }
    locateUserAndDisplay(floorNumber, docID);
    locationUpdateInterval = setInterval(() => {
      locateUserAndDisplay(floorNumber, docID);
    }, updateInterval);

    // Read companyId from Firestore and set it as text content
    db.collection("companies")
      .doc(docID)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const companyId = doc.data().companyId;
          document.getElementById("company-id").textContent = companyId;
        } else {
          console.log("No such document!");
        }
      })
      .catch((error) => {
        console.log("Error getting document:", error);
      });
  }

  // Function to locate user and display UI for the selected floor
  function locateUserAndDisplay(floorNumber, companyName) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          updateUIForFloor(userCoords, floorNumber, companyName);
        },
        () => {
          console.log("Unable to access your location.");
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0,
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }

  let lastLoggedAreaKey = null; // Track the last area the user was logged in
  const userEntryLog = {};

  // Function to log user entry to Firestore when they are inside or very close to an area
  // Function to log user entry to Firestore when they are inside or very close to an area
  function logUserEntry(companyId, floorIndex, area, userCoords) {
    if (!area || !area.name) {
      console.error("Invalid area data provided. Cannot log entry.");
      return; // Exit if area data is invalid
    }

    const logKey = `${companyId}-${floorIndex}-${area.name}`;
    if (!userEntryLog[logKey]) {
      // Check if this area has already been logged for the user in this session
      const userEntry = {
        timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Log the current time
        areaName: area.name, // Ensure area name is logged
        userCoords: userCoords, // Log user coordinates
        areaCoords: area.coords, // Log area coordinates
      };

      // Add log to the specific area in the company document
      db.collection("companies")
        .doc(companyId)
        .collection("logs")
        .add(userEntry)
        .then(() => {
          console.log(`User log entry successfully written for ${area.name}!`);
        })
        .catch((error) => {
          console.error("Error writing user log entry: ", error);
        });

      userEntryLog[logKey] = true; // Mark this area as logged
    }
  }

  // Updated function to update UI for the selected floor
  function updateUIForFloor(userCoords, floorIndex, companyId) {
    db.collection("companies")
      .doc(companyId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const companyData = doc.data();
          const selectedFloorData = companyData.floorsData[floorIndex];
          if (selectedFloorData) {
            const areasWithDistance = selectedFloorData.areas.map((area) => ({
              ...area,
              distance: calculateDistance(userCoords, area.coords),
            }));
            updateUI(areasWithDistance);
            // Determine if logging is needed and handle log resetting
            handleAreaLogging(
              areasWithDistance,
              companyId,
              floorIndex,
              userCoords
            );
          }
        }
      });
  }

  function handleAreaLogging(
    areasWithDistance,
    companyId,
    floorIndex,
    userCoords
  ) {
    areasWithDistance.forEach((area) => {
      const currentAreaKey = `${companyId}-${floorIndex}-${area.name}`;
      if (area.distance <= area.radius) {
        if (lastLoggedAreaKey !== currentAreaKey) {
          if (lastLoggedAreaKey) {
            userEntryLog[lastLoggedAreaKey] = false; // Reset the previous area log status
          }
          logUserEntry(companyId, floorIndex, area, userCoords);
          lastLoggedAreaKey = currentAreaKey; // Update the last logged area
        }
      }
    });
  }

  // Function to calculate distance between two coordinates (in meters)
  function calculateDistance(coords1, coords2) {
    const earthRadius = 6371e3; // meters
    const lat1Radians = (coords1.lat * Math.PI) / 180;
    const lat2Radians = (coords2.lat * Math.PI) / 180;
    const deltaLatRadians = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const deltaLngRadians = ((coords2.lng - coords1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRadians / 2) * Math.sin(deltaLatRadians / 2) +
      Math.cos(lat1Radians) *
        Math.cos(lat2Radians) *
        Math.sin(deltaLngRadians / 2) *
        Math.sin(deltaLngRadians / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c; // in meters
  }

  // Function to update UI based on areas and distance
  // Function to update UI based on areas and distance
  function updateUI(areas) {
    const mainLightContainer = document.getElementById("main-light");
    const otherLightsContainer = document.getElementById("other-lights");
    const adsContainer = document.getElementById("ads-container"); // Container for ads

    // Clear existing contents
    mainLightContainer.innerHTML = "";
    otherLightsContainer.innerHTML = "";
    adsContainer.innerHTML = ""; // Clear ads every time the UI updates

    // Sort areas based on distance in ascending order
    areas.sort((a, b) => a.distance - b.distance);

    // Iterate through sorted areas to create light elements and handle ads
    areas.forEach((area, index) => {
      // Create a new div element for the light
      const lightElement = document.createElement("div");
      lightElement.className =
        "traffic-light " + (index === 0 ? "main" : "smaller");
      const colorAndStatus = getColorAndStatus(area.distance, area.radius);
      lightElement.innerHTML = `
    <div class="light" style="background-color: ${colorAndStatus.color};"></div>
    <span class="light-label">${area.name}: ${colorAndStatus.status}</span>
  `;

      // Append the first element as the main light, others as smaller lights
      if (index === 0) {
        mainLightContainer.appendChild(lightElement);
      } else {
        if (index === 1) {
          // Add a separator before adding other lights to visually distinguish
          const separator = document.createElement("div");
          separator.className = "separator";
          otherLightsContainer.appendChild(separator);
        }
        otherLightsContainer.appendChild(lightElement);
      }
    });

    // If no ad is applicable, ensure the ads container remains empty
    if (!adsContainer.hasChildNodes()) {
      adsContainer.style.display = "none"; // Hide the container if no ads are displayed
    } else {
      adsContainer.style.display = "block"; // Show the container if ads are available
    }
  }

  // Function to get color and status based on distance and radius
  // Mock function for getColorAndStatus just for context
  function getColorAndStatus(distance, radius) {
    const status = distance < radius ? "Inside" : "Outside";
    const color = distance < radius ? "#4CAF50" : "#F44336"; // Green for inside, Red for outside
    return { color, status };
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
  // Function to swap the clicked light with the main light
  function swapWithMainLight(index) {
    const areas = [...document.querySelectorAll(".traffic-light")];
    const mainArea = areas.splice(index, 1)[0];
    areas.unshift(mainArea);

    // Reset the UI with new order
    updateUI(
      areas.map((area) => ({
        name: area.textContent.split(":")[0],
        distance: parseFloat(area.textContent.split(":")[1].trim()),
        radius: 100, // Assume some default radius
      }))
    );
  }

  // Event listener for when a floor is selected
  document
    .getElementById("floor-select")
    .addEventListener("change", function (e) {
      const floorNumber = parseInt(this.value, 10);
      const companyName = this.options[this.selectedIndex].dataset.companyName;
      startLocationUpdates(floorNumber, companyName); // Existing function to update UI

      // Fetch new floor data and update markers
      fetchFloorDataAndAddMarkers(floorNumber, companyName);
    });

  function fetchFloorDataAndAddMarkers(floorIndex, companyId) {
    db.collection("companies")
      .doc(companyId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const floorData = doc.data().floorsData[floorIndex];
          if (floorData) {
            addMarkersForFloor(floorData.areas, map); // Update markers for the selected floor
          }
        } else {
          console.log("No such document!");
        }
      })
      .catch((error) => {
        console.error("Error getting document:", error);
      });
  }

  // Call the function to initialize the closest company updates
  fetchClosestCompanyAndStartUpdates();
  // writeFloorsDataToFirestore();
});








