document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firestore
  const db = firebase.firestore();

  // Define variables
  let locationUpdateInterval;
  const updateInterval = 500; // update location every 500 milliseconds
  // Define floorsData including extra companies, minimum 2 floors, and at least 2 areas on second floors
  const floorsData = [
    {
      companyId: "company1",
      floorsData: [
        {
          floor: 1,
          areas: [
            {
              name: "Vestergate",
              coords: { lat: 55.6438022332892, lng: 9.645921707177573 },
              radius: 14,
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
    {
      companyId: "company2",
      floorsData: [
        {
          floor: 1,
          areas: [
            {
              name: "SøderGade",
              coords: { lat: 55.64128357762472, lng: 9.646158041216147 },
              radius: 14,
            },
            // Add more areas for company2 if needed
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
              name: "Second Floor Area 1",
              coords: { lat: 55.644, lng: 9.642 },
              radius: 20,
            },
            // Add more areas for the second floor of company2 if needed
            {
              name: "Second Floor Area 2",
              coords: { lat: 55.645, lng: 9.643 },
              radius: 16,
            },
          ],
        },
      ],
    },
    {
      companyId: "company3",
      floorsData: [
        {
          floor: 1,
          areas: [
            {
              name: "Example Area 1",
              coords: { lat: 55.643, lng: 9.645 },
              radius: 20,
            },
            // Add more areas for company3 if needed
            {
              name: "Example Area 2",
              coords: { lat: 55.642, lng: 9.646 },
              radius: 15,
            },
          ],
        },
        {
          floor: 2,
          areas: [
            {
              name: "Second Floor Area 1",
              coords: { lat: 55.644, lng: 9.642 },
              radius: 20,
            },
            // Add more areas for the second floor of company3 if needed
            {
              name: "Second Floor Area 2",
              coords: { lat: 55.645, lng: 9.643 },
              radius: 18,
            },
          ],
        },
      ],
    },
    {
      companyId: "company4",
      floorsData: [
        {
          floor: 1,
          areas: [
            {
              name: "Another Example Area",
              coords: { lat: 55.645, lng: 9.648 },
              radius: 18,
            },
            // Add more areas for company4 if needed
            {
              name: "Yet Another Example Area",
              coords: { lat: 55.644, lng: 9.647 },
              radius: 16,
            },
          ],
        },
        {
          floor: 2,
          areas: [
            {
              name: "Second Floor Area 1",
              coords: { lat: 55.644, lng: 9.642 },
              radius: 20,
            },
            // Add more areas for the second floor of company4 if needed
            {
              name: "Second Floor Area 2",
              coords: { lat: 55.645, lng: 9.643 },
              radius: 18,
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

  // Function to find the closest company based on user coordinates
  function findClosestCompany(userCoords) {
    db.collection("companies")
      .get()
      .then((querySnapshot) => {
        let closestCompanyDocId = null;
        let closestDistance = Infinity;
        let closestFloorsData = [];

        querySnapshot.forEach((doc) => {
          const companyData = doc.data();
          if (companyData && companyData.floorsData) {
            companyData.floorsData.forEach((floorData) => {
              floorData.areas.forEach((area) => {
                const distance = calculateDistance(userCoords, area.coords);
                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestCompanyDocId = doc.id;
                  closestFloorsData = companyData.floorsData;
                }
              });
            });
          }
        });

        if (closestCompanyDocId) {
          document.getElementById("company-id").textContent =
            closestCompanyDocId;
          populateFloorDropdown(closestFloorsData, closestCompanyDocId);
          // Find the index of the floor closest to the user
          const closestFloorIndex = closestFloorsData.findIndex(
            (floorData) => floorData.floor === 1
          );
          // Start location updates for the closest floor
          startLocationUpdates(
            closestFloorIndex !== -1 ? closestFloorIndex : 0,
            closestCompanyDocId
          );
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
          alert("Unable to access your location.");
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0,
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
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
  function startLocationUpdates(floorNumber, companyName) {
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
    }
    locateUserAndDisplay(floorNumber, companyName);
    locationUpdateInterval = setInterval(() => {
      locateUserAndDisplay(floorNumber, companyName);
    }, updateInterval);
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
          alert("Unable to access your location.");
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0,
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  // Function to update UI for the selected floor
  function updateUIForFloor(userCoords, floorIndex, companyName) {
    db.collection("companies")
      .doc(companyName)
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
          } else {
            console.log("Floor data not found for the selected floor.");
          }
        } else {
          console.log("Company document not found.");
        }
      })
      .catch((error) => {
        console.error("Error getting company document:", error);
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
  function updateUI(areas) {
    const mainLightContainer = document.getElementById("main-light");
    const otherLightsContainer = document.getElementById("other-lights");

    // Clear existing contents
    mainLightContainer.innerHTML = "";
    otherLightsContainer.innerHTML = "";

    // Sort areas based on distance in ascending order
    areas.sort((a, b) => a.distance - b.distance);

    // Iterate through sorted areas to create light elements
    areas.forEach((area, index) => {
      // Create a new div element for the light
      const lightElement = document.createElement("div");
      lightElement.className =
        "traffic-light " + (index === 0 ? "main" : "smaller");

      // Determine color and status based on the area properties
      const colorAndStatus = getColorAndStatus(area.distance, area.radius);
      lightElement.innerHTML = lightElement.innerHTML = `
    <div class="light" style="background-color: ${colorAndStatus.color};"></div>
    <span class="light-label">${area.name}: ${colorAndStatus.status}</span>
`;

      // Append the first element as the main light, others as smaller lights
      if (index === 0) {
        mainLightContainer.appendChild(lightElement);
      } else {
        otherLightsContainer.appendChild(lightElement);

        // Add click event listener to swap with main light
        lightElement.addEventListener("click", function () {
          swapWithMainLight(index);
        });
      }
    });
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
    .addEventListener("change", function () {
      const floorNumber = parseInt(this.value, 10);
      const companyName = this.options[this.selectedIndex].dataset.companyName;
      startLocationUpdates(floorNumber, companyName);
    });

  // Call the function to initialize the closest company updates
  fetchClosestCompanyAndStartUpdates();
});
