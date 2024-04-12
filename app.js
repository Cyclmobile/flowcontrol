document.addEventListener("DOMContentLoaded", function () {
  const trafficLights = [
    {
      name: "vestergade ut",
      coords: { lat: 55.64377466555561, lng: 9.645927939188951 },
    },
    {
      name: "Vestergade kryss",
      coords: { lat: 55.643753474193936, lng: 9.645793828741228 },
    },
    {
      name: "Vestergade mot skole",
      coords: { lat: 55.64263427495033, lng: 9.648590091598367 },
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
                <div class="light" style="background-color: ${
                  light.color
                };"></div>
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
    function toRad(x) {
      return (x * Math.PI) / 180;
    }
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

  function locateUser() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          let lightsWithDistances = trafficLights.map((light) => {
            const distance = calculateDistance(userCoords, light.coords);
            const colors = {
              100: "green",
              50: "yellow",
              30: "yellow",
              20: "red",
              10: "green",
              0: "green",
            };
            let color = "grey";
            for (const [limit, c] of Object.entries(colors)) {
              if (distance <= limit) {
                color = c;
                break;
              }
            }
            return { ...light, distance, color };
          });

          // Sort by distance
          lightsWithDistances.sort((a, b) => a.distance - b.distance);
          updateUI(lightsWithDistances);
        },
        () => {
          alert("Geolocation is not supported by this browser.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  locateUser();
  setInterval(locateUser, 5000); // Update location every 5 seconds
});
