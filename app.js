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

  // Function to fetch floorsData for the closest company and start location updates
  // Function to fetch floorsData for the closest company and start location updates
  function fetchClosestCompanyAndStartUpdates() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          db.collection("companies")
            .get()
            .then((querySnapshot) => {
              let closestCompany = null;
              let closestDistance = Infinity;

              querySnapshot.forEach((doc) => {
                const companyData = doc.data();
                if (companyData && companyData.floorsData) {
                  companyData.floorsData.forEach((floorData) => {
                    floorData.areas.forEach((area) => {
                      const distance = calculateDistance(
                        userCoords,
                        area.coords
                      );
                      if (distance < closestDistance) {
                        closestDistance = distance;
                        closestCompany = companyData;
                      }
                    });
                  });
                }
              });

              // Update UI with closest company data
              if (closestCompany) {
                document.getElementById("company-id").textContent =
                  closestCompany.companyId;
                console.log("Closest company:", closestCompany);
                populateFloorDropdown(closestCompany.floorsData);
                startLocationUpdates(closestCompany.floorsData[0].floor);
              }
            })
            .catch((error) => {
              console.log("Error getting documents: ", error);
            });
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

  // Fetch floorsData from Firestore for all companies and start location updates
  function fetchFloorsDataAndStartUpdates() {
    db.collection("companies")
      .get()
      .then((querySnapshot) => {
        let allFloorsData = [];
        querySnapshot.forEach((doc) => {
          const companyData = doc.data();
          if (companyData && companyData.floorsData) {
            allFloorsData = allFloorsData.concat(companyData.floorsData); // Aggregate floors from all companies
          }
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
      if (floorData.floor) {
        uniqueFloors.add(floorData.floor); // Add floor number to the Set
      }
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
    const companyId = getSelectedCompanyId(); // Get the selected companyId dynamically
    // Fetch floorsData for the selected floor and company
    db.collection("companies")
      .doc(companyId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const companyData = doc.data();
          if (companyData && companyData.floorsData) {
            const selectedFloorData = companyData.floorsData.find(
              (floorData) => floorData.floor === floorNumber
            );
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
            console.log("No floors data available for the company.");
          }
        } else {
          console.log("Company document not found.");
        }
      })
      .catch((error) => {
        console.log("Error getting company document:", error);
      });
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

  // Mock function for getColorAndStatus just for context
  function getColorAndStatus(distance, radius) {
    const status = distance < radius ? "Inside" : "Outside";
    const color = distance < radius ? "#4CAF50" : "#F44336"; // Green for inside, Red for outside
    return { color, status };
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
    const φ2 = (coords2.lat * Math.PI) / 180;
    const Δφ = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const Δλ = ((coords2.lng - coords1.lng) * Math.PI) / 180;

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

  // Function to get the selected companyId dynamically based on the selected floor
  function getSelectedCompanyId() {
    const floorSelect = document.getElementById("floor-select");
    const selectedFloor = parseInt(floorSelect.value, 10);
    // Implement your logic to get the companyId based on the selected floor
    // For now, returning a default value
    return "company1";
  }

  // Write floorsData to Firestore when the document is loaded
  // writeFloorsDataToFirestore();

  // Initialize updates for the closest company when the page loads
  fetchClosestCompanyAndStartUpdates();
});
