document.addEventListener("DOMContentLoaded", function () {
  const trafficLights = [
    {
      name: "Parkering 1",
      coords: { lat: 55.64386269220633, lng: 9.645867046922179 },
      radius: 14,
    },
    {
      name: "Parkering 2",
      coords: { lat: 55.64390120211904, lng: 9.646164829071308 },
      radius: 14,
    },
    {
      name: "Parkering 3",
      coords: { lat: 55.643892485436, lng: 9.646238603465296 },
      radius: 14,
    },
  ];

  const mainLightContainer = document.getElementById("main-light");
  const otherLightsContainer = document.getElementById("other-lights");

  function updateUI(trafficLightsWithDistances) {
    mainLightContainer.innerHTML = "";
    otherLightsContainer.innerHTML = "";

    trafficLightsWithDistances.forEach((light, index) => {
      const lightElement = document.createElement("div");
      lightElement.className =
        "traffic-light " + (index === 0 ? "main" : "smaller");
      lightElement.innerHTML = `
        <div class="light" style="background-color: ${light.color};"></div>
        <div class="light-info">${light.name}: ${
        light.isInside ? "Inside or nearby" : light.distance + " m"
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
    const R = 6371e3;
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

  function getTrafficLightColor(distance, radius) {
    if (distance < radius) {
      return "red"; // Inside the radius
    } else if (distance <= 100) {
      return "yellow"; // Close
    } else if (distance <= 300) {
      return "red"; // Bit further away
    } else {
      return "grey"; // Very far
    }
  }

  let locationBuffer = [];

  function locateUser() {
    const options = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 1000,
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          locationBuffer.push({ lat: latitude, lng: longitude });
          if (locationBuffer.length > 5) locationBuffer.shift();

          const averageCoords = locationBuffer.reduce(
            (acc, coords) => ({
              lat: acc.lat + coords.lat,
              lng: acc.lng + coords.lng,
            }),
            { lat: 0, lng: 0 }
          );

          averageCoords.lat /= locationBuffer.length;
          averageCoords.lng /= locationBuffer.length;

          let lightsWithDistances = trafficLights.map((light) => {
            const distance = calculateDistance(averageCoords, light.coords);
            return {
              ...light,
              distance,
              isInside: distance < light.radius,
              color: getTrafficLightColor(distance, light.radius),
            };
          });

          updateUI(lightsWithDistances);
        },
        () => {
          // Handle location errors here
        },
        options
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  locateUser();
  setInterval(locateUser, 1000);
});
