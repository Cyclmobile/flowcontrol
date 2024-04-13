document.addEventListener("DOMContentLoaded", function () {
  const trafficLights = [
    {
      name: "Parkering 1",
      coords: { lat: 55.643906108407066, lng: 9.646137350073912 },
    },
    {
      name: "Parkering 2",
      coords: { lat: 55.64390120211904, lng: 9.646164829071308 },
    },
    {
      name: "Parkering 3",
      coords: { lat: 55.643892485436, lng: 9.646238603465296 },
    },
  ];

  const mainLightContainer = document.getElementById("main-light");
  const otherLightsContainer = document.getElementById("other-lights");

  function updateUI(trafficLightsWithDistances) {
    mainLightContainer.innerHTML = ""; // Clear only once
    otherLightsContainer.innerHTML = ""; // Clear only once

    trafficLightsWithDistances.forEach((light, index) => {
      const lightElement = document.createElement("div");
      lightElement.className =
        "traffic-light " + (index === 0 ? "main" : "smaller");
      lightElement.innerHTML = `
        <div class="light" style="background-color: ${light.color};"></div>
        <div class="light-info">${light.name}: ${
        light.distance > 100 ? "--" : light.distance + " m"
      }</div>
      `;
      if (index === 0) {
        mainLightContainer.appendChild(lightElement);
      } else {
        otherLightsContainer.appendChild(lightElement);
      }
    });
  }

  function calculateDistance(coords1, coords2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3; // Earth's radius in meters
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords1.lat)) *
        Math.cos(toRad(coords2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  let locationBuffer = [];

  function locateUser() {
    const options = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 2000,
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          locationBuffer.push({ lat: latitude, lng: longitude });
          if (locationBuffer.length > 5) locationBuffer.shift(); // Keep the buffer size at 5

          const averageCoords = locationBuffer.reduce(
            (acc, coords) => {
              acc.lat += coords.lat;
              acc.lng += coords.lng;
              return acc;
            },
            { lat: 0, lng: 0 }
          );

          averageCoords.lat /= locationBuffer.length;
          averageCoords.lng /= locationBuffer.length;

          let lightsWithDistances = trafficLights.map((light) => ({
            ...light,
            distance: calculateDistance(averageCoords, light.coords),
            color: "grey", // default color before assignment
          }));

          // Update colors based on distance
          lightsWithDistances.forEach((light) => {
            const colors = {
              100: "green",
              50: "yellow",
              30: "yellow",
              20: "red",
              10: "green",
              0: "green",
            };
            const foundColor = Object.entries(colors).find(
              ([limit]) => light.distance <= limit
            );
            light.color = foundColor ? foundColor[1] : "grey"; // Set 'grey' as default if no limit matches
          });

          // Sort by distance
          lightsWithDistances.sort((a, b) => a.distance - b.distance);
          updateUI(lightsWithDistances);
        },
        () => {
          alert("Geolocation is not supported by this browser.");
        },
        options
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  locateUser();
  setInterval(locateUser, 2000); // Update location every 2 seconds
});
