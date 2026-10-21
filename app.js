// Create the map and centre it on the island of Corfu.
const map = L.map("map", {
  zoomControl: false
}).setView([39.6, 19.85], 10);

// Put the zoom buttons in a predictable position below the header.
L.control.zoom({ position: "bottomright" }).addTo(map);

const mapStatus = document.querySelector("#map-status");

// Add the OpenStreetMap background tiles.
const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["a", "b", "c"],
  attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
}).addTo(map);

let hasLoadedTile = false;

// Warn clearly when a browser or network blocks the remote map images.
tileLayer.on("tileload", () => {
 hasLoadedTile = true;
 mapStatus.classList.remove("is-visible");
});

tileLayer.on("tileerror", () => {
 if (!hasLoadedTile) {
   mapStatus.textContent =
     "La carte ne peut pas charger son fond. Vérifie ta connexion puis ouvre le projet avec un serveur local.";
   mapStatus.classList.add("is-visible");
 }
});

// Also show a useful message when requests are silently blocked by the browser.
window.setTimeout(() => {
 if (!hasLoadedTile) {
   mapStatus.textContent =
     "Le fond de carte est indisponible. Lance le projet avec « python -m http.server » puis ouvre http://localhost:8000.";
   mapStatus.classList.add("is-visible");
 }
}, 3000);

// Fit the initial view around every place so no marker is hidden on small screens.
const bounds = L.latLngBounds(places.map(place => [place.lat, place.lng]));
map.fitBounds(bounds, { padding: [24, 24] });

// Check if a specific place was requested via URL parameters
const urlParams = new URLSearchParams(window.location.search);
const placeName = urlParams.get('place');

if (placeName) {
  const targetPlace = places.find(p => p.name === placeName);
  if (targetPlace) {
    map.setView([targetPlace.lat, targetPlace.lng], 15);
    // Find the marker for this place and open its popup
    // We need to wait for markers to be created first
  }
}

// Add one marker and popup for every place in the data file.
const markers = [];

places.forEach(place => {
  const marker = L.marker([place.lat, place.lng])
    .addTo(map)
    .bindPopup(`
      <article class="place-popup">
        <p class="place-popup__category">${place.category}</p>
        <h2>${place.name}</h2>
        <p>${place.description}</p>
      </article>
    `);
  
  // Store marker and its data for filtering and searching
  markers.push({ marker, category: place.category, name: place.name });

  // If this is the place from URL, open its popup
  if (placeName === place.name) {
    marker.openPopup();
  }
});

// Update the place count in the header
document.querySelector("#place-count").textContent = places.length;

// Common function to update visible markers based on current filters and search
function updateMarkers() {
  const activeCategory = document.querySelector(".filter-btn.active").dataset.category;
  const searchQuery = document.querySelector("#search-input").value.toLowerCase();

  markers.forEach(({ marker, category, name }) => {
    const matchesCategory = activeCategory === "all" || category === activeCategory;
    const matchesSearch = name.toLowerCase().includes(searchQuery);

    if (matchesCategory && matchesSearch) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });

  // Update count based on visible markers
  const visibleCount = markers.filter(({ marker }) => map.hasLayer(marker)).length;
  document.querySelector("#place-count").textContent = visibleCount;
}

// Handle category filtering
const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updateMarkers();
  });
});

// Handle search input
const searchInput = document.querySelector("#search-input");
searchInput.addEventListener("input", updateMarkers);