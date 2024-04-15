document.addEventListener("DOMContentLoaded", function () {
  const floorsData = [
    {
      floor: 1,
      areas: [
        {
          name: "Parkering 1",
          coords: { lat: 55.64386269220633, lng: 9.645867046922179 },
          radius: 14,
        },
        {
          name: "Narvesen",
          coords: { lat: 55.64390120211904, lng: 9.646164829071308 },
          radius: 14,
        },
        {
          name: "7 Eleven",
          coords: { lat: 55.64390120211904, lng: 9.646164829071308 },
          radius: 14,
        },
        {
          name: "Sisters Green",
          coords: { lat: 55.643892485436, lng: 9.646238603465296 },
          radius: 14,
        },
      ],
    },
    {
      floor: 2,
      areas: [
        {
          name: "Gucci",
          coords: { lat: 55.64386269220633, lng: 9.645867046922179 },
          radius: 14,
        },
        {
          name: "LV",
          coords: { lat: 55.64390120211904, lng: 9.646164829071308 },
          radius: 14,
        },
        {
          name: "Others 2nd Floor",
          coords: { lat: 55.643892485436, lng: 9.646238603465296 },
          radius: 14,
        },
      ],
    },
  ];

  document
    .getElementById("floor-select")
    .addEventListener("change", function () {
      const floorNumber = parseInt(this.value, 10);
      locateUserAndDisplay(floorNumber);
    });

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
        }
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

    areas.forEach((area, index) => {
      const lightElement = document.createElement("div");
      lightElement.className =
        "traffic-light " + (index === 0 ? "main" : "smaller");
      const colorAndStatus = getColorAndStatus(area.distance, area.radius);
      lightElement.innerHTML = `
        <div class="light" style="background-color: ${colorAndStatus.color};"></div>
        <span>${area.name}: ${colorAndStatus.status}</span>
      `;
      if (index === 0) {
        mainLightContainer.appendChild(lightElement);
      } else {
        otherLightsContainer.appendChild(lightElement);
      }
    });
  }

  function getColorAndStatus(distance, radius) {
    if (distance < radius) {
      return { color: "green", status: "Inside" };
    } else if (distance <= 100) {
      return { color: "yellow", status: "Nearby" };
    } else if (distance <= 300) {
      return { color: "red", status: "Close" };
    } else {
      return { color: "grey", status: "Far" };
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

    return R * c; // Distance in meters
  }

  // Initialize display for the default floor when the page loads
  locateUserAndDisplay(1);
});
