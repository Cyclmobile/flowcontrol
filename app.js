document.addEventListener("DOMContentLoaded", function () {
  const floorsData = [
    {
      floor: 1,
      areas: [
        {
          name: "Vestergate skolebakken kryss",
          coords: { lat: 55.643983861371815, lng: 9.644355296658622 },
          radius: 14,
        },
        {
          name: "SøderGade",
          coords: { lat: 55.64128357762472, lng: 9.646158041216147 },
          radius: 14,
        },
        {
          name: "Vores Grill etg",
          coords: { lat: 55.64144872327541, lng: 9.648664676806128 },
          radius: 14,
        },
        {
          name: "Banken",
          coords: { lat: 55.64174973787118, lng: 9.648960019996435 },
          radius: 14,
        },
      ],
    },
    {
      floor: 2,
      areas: [
        {
          name: "Vestergate skolebakken kryss etg 2",
          coords: { lat: 55.643983861371815, lng: 9.644355296658622 },
          radius: 14,
        },
        {
          name: "SøderGade etg 2",
          coords: { lat: 55.64128357762472, lng: 9.646158041216147 },
          radius: 14,
        },
        {
          name: "Vores Grill etg 2",
          coords: { lat: 55.64144872327541, lng: 9.648664676806128 },
          radius: 14,
        },
        {
          name: "Banken etg 2",
          coords: { lat: 55.64174973787118, lng: 9.648960019996435 },
          radius: 14,
        },
        {
          name: "Spilloppen etg2",
          coords: { lat: 55.64153289033349, lng: 9.64916377408472 },
          radius: 14,
        },
      ],
    },
  ];

  let locationUpdateInterval;
  const updateInterval = 500; // update location every 500 milliseconds

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

  function updateUIForFloor(userCoords, floorNumber) {
    const floorData = floorsData.find((floor) => floor.floor === floorNumber);
    const areasWithDistance = floorData.areas.map((area) => ({
      ...area,
      distance: calculateDistance(userCoords, area.coords),
    }));
    updateUI(areasWithDistance);
  }

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

  // function swapWithMainLight(clickedIndex) {
  //   const floorNumber = parseInt(
  //     document.getElementById("floor-select").value,
  //     10
  //   );
  //   const floorData = floorsData.find((floor) => floor.floor === floorNumber);
  //   const temp = floorData.areas[0]; // Store main light data
  //   floorData.areas[0] = floorData.areas[clickedIndex]; // Move clicked to main
  //   floorData.areas[clickedIndex] = temp; // Move old main to clicked position

  //   updateUIForFloor({ lat: 0, lng: 0 }, floorNumber); // Re-render UI with dummy coordinates
  // }

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

  // Set up floor change listener and initial update
  document
    .getElementById("floor-select")
    .addEventListener("change", function () {
      startLocationUpdates(parseInt(this.value, 10));
    });

  startLocationUpdates(1); // Initialize updates for the default floor when the page loads
});
