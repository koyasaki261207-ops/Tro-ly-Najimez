/**
 * js/map-location.js - Quản lý Trung Tâm Bản Đồ & Vị Trí Nhà Riêng Najimez
 * Sử dụng Google Maps Tiles, OSRM In-App Routing, Photon Nearby Places & Leaflet.js
 * Hoạt động 100% TRỰC TIẾP TRÊN NAJIMEZ - Không chuyển trang hay redirect
 * Chuẩn Code Modularization cho Dự Án Trợ Lý Ảo Najimez
 */

const HOME_LOC_STORAGE_KEY = 'najimez_home_location';
const DEFAULT_MAP_CENTER = [10.762622, 106.660172]; // TP. Hồ Chí Minh
const DEFAULT_MAP_ZOOM = 15;

// Cấu hình các lớp bản đồ (Google Maps chính thức qua Tile Server)
const MAP_LAYERS = {
  'google-street': {
    name: 'Đường phố Google',
    url: 'https://mt{s}.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps'
    }
  },
  'google-satellite': {
    name: 'Vệ tinh Google',
    url: 'https://mt{s}.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps'
    }
  },
  'dark-night': {
    name: 'Bản đồ Ban đêm',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 16,
      attribution: '&copy; Esri &copy; OpenStreetMap'
    }
  }
};

let currentLayerKey = 'google-street';
let mainLeafletMap = null;
let mainHomeMarker = null;
let currentMainTileLayer = null;

let inlineMiniMap = null;
let inlineHomeMarker = null;

// Quản lý tuyến đường chỉ đường trực tiếp (In-App Routing)
let currentRouteGlowLayer = null;
let currentRouteLineLayer = null;
let routeStartMarker = null;
let userGpsAccuracyCircle = null;

// Quản lý các ghim địa điểm tìm kiếm xung quanh (Nearby Places)
let nearbyPlaceMarkers = [];

let currentPickedLat = null;
let currentPickedLng = null;
let currentPickedAddress = '';
let searchDebounceTimeout = null;

/**
 * Đọc dữ liệu vị trí nhà riêng đã lưu
 */
function getSavedHomeLocation() {
  try {
    const raw = localStorage.getItem(HOME_LOC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('[MapLocation] Lỗi đọc vị trí nhà:', err);
    return null;
  }
}

/**
 * Lưu vị trí nhà riêng vào localStorage & đồng bộ
 */
function saveHomeLocationData(locData) {
  try {
    localStorage.setItem(HOME_LOC_STORAGE_KEY, JSON.stringify(locData));
    updateHomeLocationUI();
    updateMainMapWorkspaceUI();
    window.dispatchEvent(new CustomEvent('najimez-home-location-updated', { detail: locData }));

    // Cập nhật marker trên các bản đồ đang mở
    if (locData.lat && locData.lng) {
      if (mainHomeMarker) mainHomeMarker.setLatLng([locData.lat, locData.lng]);
      if (inlineHomeMarker) inlineHomeMarker.setLatLng([locData.lat, locData.lng]);
      if (mainLeafletMap) mainLeafletMap.setView([locData.lat, locData.lng], 16);
      if (inlineMiniMap) inlineMiniMap.setView([locData.lat, locData.lng], 15);
    }

    if (typeof syncLedgerToFirebase === 'function') {
      syncLedgerToFirebase(null, true);
    }
    return true;
  } catch (err) {
    console.error('[MapLocation] Lỗi lưu vị trí:', err);
    return false;
  }
}

/**
 * Cập nhật giao diện Thẻ Hộp Dụng Cụ (Card #6)
 */
function updateHomeLocationUI() {
  const homeData = getSavedHomeLocation();
  const iconAura = document.getElementById('homeLocIconAura');
  const icon = document.getElementById('homeLocIcon');
  const statusBadge = document.getElementById('homeLocStatusBadge');
  const addressEl = document.getElementById('homeLocAddress');
  const coordsRow = document.getElementById('homeLocCoordsRow');
  const coordsVal = document.getElementById('homeLocCoordsVal');
  const timeTag = document.getElementById('homeLocTimeTag');
  const btnDirections = document.getElementById('btnDirectionsHome');
  const btnClear = document.getElementById('btnClearHomeLoc');

  if (homeData && homeData.lat && homeData.lng) {
    if (iconAura) iconAura.classList.add('configured');
    if (icon) icon.className = 'fa-solid fa-house-circle-check';
    if (statusBadge) {
      statusBadge.textContent = 'Đã thiết lập';
      statusBadge.classList.add('active');
    }
    if (addressEl) {
      addressEl.textContent = homeData.address || `Tọa độ: ${homeData.lat.toFixed(5)}, ${homeData.lng.toFixed(5)}`;
    }
    if (coordsRow) coordsRow.style.display = 'flex';
    if (coordsVal) coordsVal.textContent = `${homeData.lat.toFixed(5)}, ${homeData.lng.toFixed(5)}`;
    if (timeTag && homeData.updatedAt) {
      const d = new Date(homeData.updatedAt);
      timeTag.textContent = `(Cập nhật: ${d.toLocaleDateString('vi-VN')})`;
    }
    if (btnDirections) btnDirections.disabled = false;
    if (btnClear) btnClear.style.display = 'inline-flex';

    if (inlineHomeMarker) {
      inlineHomeMarker.setLatLng([homeData.lat, homeData.lng]);
      if (inlineMiniMap) inlineMiniMap.setView([homeData.lat, homeData.lng], 15);
    }
  } else {
    if (iconAura) iconAura.classList.remove('configured');
    if (icon) icon.className = 'fa-solid fa-house-chimney';
    if (statusBadge) {
      statusBadge.textContent = 'Chưa thiết lập';
      statusBadge.classList.remove('active');
    }
    if (addressEl) {
      addressEl.textContent = 'Nhấn "Đánh Dấu Vị Trí" hoặc mở tab "Bản Đồ" để ghim nhà trên bản đồ trực quan.';
    }
    if (coordsRow) coordsRow.style.display = 'none';
    if (btnDirections) btnDirections.disabled = true;
    if (btnClear) btnClear.style.display = 'none';
  }
}

/**
 * Cập nhật bảng điều khiển tại Trung Tâm Bản Đồ (tab-map)
 */
function updateMainMapWorkspaceUI() {
  const homeData = getSavedHomeLocation();
  const statusBadge = document.getElementById('mainMapStatusBadge');
  const addressText = document.getElementById('mainMapAddressText');
  const coordsRow = document.getElementById('mainMapCoordsRow');
  const coordsVal = document.getElementById('mainMapCoordsVal');
  const btnNav = document.getElementById('btnNavigateFromMainMap');
  const btnClear = document.getElementById('btnClearFromMainMap');
  const btnHudDir = document.getElementById('btnMainMapDirections');

  if (homeData && homeData.lat && homeData.lng) {
    if (statusBadge) {
      statusBadge.textContent = 'Đã ghim vị trí';
      statusBadge.classList.add('active');
    }
    if (addressText) {
      addressText.textContent = homeData.address || `Tọa độ: ${homeData.lat.toFixed(6)}, ${homeData.lng.toFixed(6)}`;
    }
    if (coordsRow) coordsRow.style.display = 'block';
    if (coordsVal) coordsVal.textContent = `${homeData.lat.toFixed(6)}, ${homeData.lng.toFixed(6)}`;
    if (btnNav) btnNav.disabled = false;
    if (btnHudDir) btnHudDir.disabled = false;
    if (btnClear) btnClear.style.display = 'inline-flex';
  } else {
    if (statusBadge) {
      statusBadge.textContent = 'Chưa thiết lập';
      statusBadge.classList.remove('active');
    }
    if (addressText) {
      addressText.textContent = 'Chưa có vị trí. Hãy nhấp chuột hoặc kéo ghim 🏠 trên bản đồ để chọn nhà bạn.';
    }
    if (coordsRow) coordsRow.style.display = 'none';
    if (btnNav) btnNav.disabled = true;
    if (btnHudDir) btnHudDir.disabled = true;
    if (btnClear) btnClear.style.display = 'none';
  }
}

/**
 * Chuyển đổi lớp bản đồ Google (Đường phố / Vệ tinh / Ban đêm)
 */
function switchMainMapLayer(layerKey) {
  if (!mainLeafletMap || !MAP_LAYERS[layerKey]) return;
  currentLayerKey = layerKey;

  if (currentMainTileLayer) {
    mainLeafletMap.removeLayer(currentMainTileLayer);
  }

  const cfg = MAP_LAYERS[layerKey];
  currentMainTileLayer = L.tileLayer(cfg.url, cfg.options).addTo(mainLeafletMap);
  currentMainTileLayer.bringToBack();

  const pills = document.querySelectorAll('.btn-layer-pill');
  pills.forEach(p => p.classList.toggle('active', p.dataset.layer === layerKey));
}

/**
 * Chuyển sang Tab Trung Tâm Bản Đồ
 */
function switchTabToMap() {
  const navMapBtn = document.querySelector('.sidebar-nav .nav-item[data-tab="tab-map"]');
  if (navMapBtn) {
    navMapBtn.click();
  }
}

/**
 * Khởi tạo Leaflet Map Lớn tại Trung Tâm Bản Đồ (tab-map)
 */
function initMainLeafletMap() {
  if (mainLeafletMap || typeof L === 'undefined') return;

  const mapContainer = document.getElementById('mainLeafletMap');
  if (!mapContainer) return;

  const homeData = getSavedHomeLocation();
  const initialCenter = (homeData && homeData.lat && homeData.lng)
    ? [homeData.lat, homeData.lng]
    : DEFAULT_MAP_CENTER;
  const initialZoom = (homeData && homeData.lat && homeData.lng) ? 16 : DEFAULT_MAP_ZOOM;

  mainLeafletMap = L.map('mainLeafletMap', {
    center: initialCenter,
    zoom: initialZoom,
    zoomControl: true
  });

  const cfg = MAP_LAYERS[currentLayerKey] || MAP_LAYERS['google-street'];
  currentMainTileLayer = L.tileLayer(cfg.url, cfg.options).addTo(mainLeafletMap);

  // Custom Neon Home Pin
  const homeDivIcon = L.divIcon({
    className: 'custom-neon-pin-wrapper',
    html: '<div class="neon-home-marker" title="Kéo thả ghim để chọn vị trí"><i class="fa-solid fa-house-chimney"></i></div>',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  mainHomeMarker = L.marker(initialCenter, {
    icon: homeDivIcon,
    draggable: true
  }).addTo(mainLeafletMap);

  currentPickedLat = initialCenter[0];
  currentPickedLng = initialCenter[1];

  mainHomeMarker.on('dragend', (e) => {
    const latlng = e.target.getLatLng();
    setMainMapPickedLocation(latlng.lat, latlng.lng, null, false, true);
  });

  mainLeafletMap.on('click', (e) => {
    setMainMapPickedLocation(e.latlng.lat, e.latlng.lng, null, false, true);
  });

  if (homeData && homeData.address) {
    setMainMapPickedLocation(homeData.lat, homeData.lng, homeData.address, false, false);
  }
}

/**
 * Khởi tạo Bản đồ mini tương tác ngay trên thẻ Hộp Dụng Cụ
 */
function initInlineMiniMap() {
  if (inlineMiniMap || typeof L === 'undefined') return;

  const miniContainer = document.getElementById('homeInlineMiniMap');
  if (!miniContainer) return;

  const homeData = getSavedHomeLocation();
  const initialCenter = (homeData && homeData.lat && homeData.lng)
    ? [homeData.lat, homeData.lng]
    : DEFAULT_MAP_CENTER;

  inlineMiniMap = L.map('homeInlineMiniMap', {
    center: initialCenter,
    zoom: 15,
    zoomControl: false,
    attributionControl: false
  });

  L.tileLayer(MAP_LAYERS['google-street'].url, MAP_LAYERS['google-street'].options).addTo(inlineMiniMap);

  const miniDivIcon = L.divIcon({
    className: 'custom-neon-pin-wrapper',
    html: '<div class="neon-home-marker" style="width:34px;height:34px;font-size:15px;"><i class="fa-solid fa-house-chimney"></i></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  inlineHomeMarker = L.marker(initialCenter, { icon: miniDivIcon }).addTo(inlineMiniMap);

  inlineMiniMap.on('click', () => {
    switchTabToMap();
  });
}

/**
 * Cập nhật vị trí được chọn trên Main Map
 */
function setMainMapPickedLocation(lat, lng, addressText = null, shouldPan = true, shouldReverseGeocode = true) {
  currentPickedLat = lat;
  currentPickedLng = lng;

  if (mainHomeMarker) mainHomeMarker.setLatLng([lat, lng]);
  if (mainLeafletMap && shouldPan) {
    mainLeafletMap.setView([lat, lng], Math.max(mainLeafletMap.getZoom(), 16));
  }

  const coordsRow = document.getElementById('mainMapCoordsRow');
  const coordsVal = document.getElementById('mainMapCoordsVal');
  if (coordsRow) coordsRow.style.display = 'block';
  if (coordsVal) coordsVal.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const addrText = document.getElementById('mainMapAddressText');
  if (addressText) {
    currentPickedAddress = addressText;
    if (addrText) addrText.textContent = addressText;
  } else if (shouldReverseGeocode) {
    if (addrText) addrText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác định tên địa chỉ...';
    reverseGeocodeLocation(lat, lng, (resolvedAddr) => {
      currentPickedAddress = resolvedAddr;
      if (addrText) addrText.textContent = resolvedAddr;
    });
  }
}

/**
 * Tra cứu địa chỉ tiếng Việt từ tọa độ GPS (BigDataCloud + OpenStreetMap Nominatim)
 */
function reverseGeocodeLocation(lat, lng, callback) {
  const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`;

  fetch(bdcUrl)
    .then(res => res.json())
    .then(data => {
      const parts = [data.locality, data.city, data.principalSubdivision].filter(Boolean);
      if (parts.length > 0) {
        if (callback) callback(parts.join(', '));
        return;
      }
      throw new Error('No locality parts');
    })
    .catch(() => {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      fetch(osmUrl, { headers: { 'Accept-Language': 'vi,en' } })
        .then(res => res.json())
        .then(data => {
          const addr = (data && data.display_name) || `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          if (callback) callback(addr);
        })
        .catch(() => {
          if (callback) callback(`Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        });
    });
}

/**
 * Tìm kiếm địa chỉ qua tọa độ trực tiếp, Photon API hoặc Nominatim
 */
function searchMainMapAddress(query) {
  if (!query || query.trim().length < 2) return;
  const cleanQ = query.trim();

  // 1. Kiểm tra nếu người dùng nhập hoặc dán tọa độ trực tiếp (VD: "10.7768, 106.7008" hoặc link Google Maps)
  const coordsRegex = /@?(-?\d+\.\d+)[,\s/]+(-?\d+\.\d+)/;
  const match = cleanQ.match(coordsRegex);
  if (match) {
    const pLat = parseFloat(match[1]);
    const pLng = parseFloat(match[2]);
    if (pLat >= -90 && pLat <= 90 && pLng >= -180 && pLng <= 180) {
      setMainMapPickedLocation(pLat, pLng, null, true, true);
      const resultsDropdown = document.getElementById('mainMapSearchResults');
      if (resultsDropdown) resultsDropdown.style.display = 'none';
      if (typeof showToast === 'function') {
        showToast(`Đã bay tới tọa độ: ${pLat.toFixed(5)}, ${pLng.toFixed(5)}!`, 'success');
      }
      return;
    }
  }

  const resultsDropdown = document.getElementById('mainMapSearchResults');
  if (resultsDropdown) {
    resultsDropdown.innerHTML = '<div class="search-result-item" style="color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tìm kiếm địa điểm...</div>';
    resultsDropdown.style.display = 'block';
  }

  // 2. Thử Photon Geocoding API (hỗ trợ tiếng Việt không dấu, tìm nhanh)
  const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQ)}&limit=6`;
  fetch(photonUrl)
    .then(res => res.json())
    .then(data => {
      const features = (data && data.features) || [];
      if (features.length > 0) {
        renderSearchResultsList(features.map(f => {
          const p = f.properties || {};
          const c = (f.geometry && f.geometry.coordinates) || [0, 0];
          const parts = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean);
          return {
            displayName: parts.join(', ') || p.name || cleanQ,
            lat: c[1],
            lng: c[0]
          };
        }));
        return;
      }
      throw new Error('No photon results');
    })
    .catch(() => {
      // 3. Dự phòng Nominatim
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQ)}&countrycodes=vn&limit=5&addressdetails=1`;
      fetch(osmUrl, { headers: { 'Accept-Language': 'vi,en' } })
        .then(res => res.json())
        .then(list => {
          if (!list || list.length === 0) {
            if (resultsDropdown) {
              resultsDropdown.innerHTML = '<div class="search-result-item" style="color:#f87171;">Không tìm thấy địa điểm. Thử gõ tên đường, quận hoặc dán tọa độ.</div>';
            }
            return;
          }
          renderSearchResultsList(list.map(item => ({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          })));
        })
        .catch(err => {
          console.warn('[MapLocation] Lỗi tìm kiếm:', err);
          if (resultsDropdown) {
            resultsDropdown.innerHTML = '<div class="search-result-item" style="color:#f87171;">Lỗi kết nối tra cứu địa chỉ.</div>';
          }
        });
    });
}

function renderSearchResultsList(items) {
  const resultsDropdown = document.getElementById('mainMapSearchResults');
  if (!resultsDropdown) return;
  resultsDropdown.innerHTML = '';
  items.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'search-result-item';
    itemEl.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#38bdf8; margin-right:6px;"></i> ${item.displayName}`;
    itemEl.addEventListener('click', () => {
      setMainMapPickedLocation(item.lat, item.lng, item.displayName, true, false);
      resultsDropdown.style.display = 'none';
    });
    resultsDropdown.appendChild(itemEl);
  });
}

/**
 * Định vị GPS qua trình duyệt trên Main Map
 */
function locateViaGPSOnMainMap() {
  if (!navigator.geolocation) {
    alert('Trình duyệt của bạn không hỗ trợ định vị GPS!');
    return;
  }

  const overlay = document.getElementById('mainMapLoadingOverlay');
  const overlayText = document.getElementById('mainMapLoadingText');
  if (overlay) {
    if (overlayText) overlayText.textContent = 'Đang bắt tín hiệu GPS...';
    overlay.style.display = 'flex';
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (overlay) overlay.style.display = 'none';
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = pos.coords.accuracy || 0;

      setMainMapPickedLocation(lat, lng, null, true, true);

      // Vòng tròn sai số định vị
      if (mainLeafletMap) {
        if (userGpsAccuracyCircle) {
          mainLeafletMap.removeLayer(userGpsAccuracyCircle);
        }
        userGpsAccuracyCircle = L.circle([lat, lng], {
          radius: Math.max(acc, 50),
          color: '#38bdf8',
          fillColor: '#38bdf8',
          fillOpacity: 0.1,
          weight: 1.5,
          dashArray: '4, 6'
        }).addTo(mainLeafletMap);
      }

      if (typeof showToast === 'function') {
        if (acc > 500) {
          showToast(`Đã định vị qua mạng Wi-Fi/IP (sai số ~${(acc / 1000).toFixed(1)}km). Hãy kéo ghim 🏠 vào đúng mái nhà bạn nhé!`, 'info');
        } else {
          showToast('Đã bắt vị trí GPS chính xác thành công!', 'success');
        }
      }
    },
    (err) => {
      if (overlay) overlay.style.display = 'none';
      console.warn('[MapLocation] Lỗi GPS:', err.message);
      alert('Không thể lấy vị trí GPS. Hãy kiểm tra quyền truy cập vị trí của trình duyệt!');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/**
 * ============================================================================
 * CHỈ ĐƯỜNG TRỰC TIẾP TRÊN NAJIMEZ (IN-APP NAVIGATION - OSRM ROUTING)
 * ============================================================================
 */
function calculateAndDrawRoute(startLat, startLng, endLat, endLng, routeTitle = 'Tuyến Đường Về Nhà') {
  if (!mainLeafletMap) initMainLeafletMap();
  switchTabToMap();

  const overlay = document.getElementById('mainMapLoadingOverlay');
  const overlayText = document.getElementById('mainMapLoadingText');
  if (overlay) {
    if (overlayText) overlayText.textContent = 'Đang vẽ tuyến đường trực tiếp...';
    overlay.style.display = 'flex';
  }

  // Gọi OSRM public API (Chỉ đường lái xe/xe máy)
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

  fetch(osrmUrl)
    .then(res => res.json())
    .then(data => {
      if (overlay) overlay.style.display = 'none';
      const routes = data && data.routes;
      if (!routes || routes.length === 0) {
        alert('Không tìm thấy tuyến đường bộ phù hợp giữa hai vị trí!');
        return;
      }

      const route = routes[0];
      const distKm = (route.distance / 1000).toFixed(1);
      const durMins = Math.max(1, Math.round(route.duration / 60));
      // Tọa độ geojson [lng, lat] chuyển sang Leaflet [lat, lng]
      const latlngs = (route.geometry.coordinates || []).map(coord => [coord[1], coord[0]]);

      clearCurrentRoute();

      // 1. Vẽ đường viền neon phát sáng (Outer glow)
      currentRouteGlowLayer = L.polyline(latlngs, {
        color: '#0284c7',
        weight: 9,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mainLeafletMap);

      // 2. Vẽ đường trung tâm (Inner neon line)
      currentRouteLineLayer = L.polyline(latlngs, {
        color: '#38bdf8',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mainLeafletMap);

      // 3. Ghim điểm xuất phát
      const startPinIcon = L.divIcon({
        className: 'custom-start-pin-wrapper',
        html: '<div style="width:30px;height:30px;border-radius:50%;background:#10b981;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;box-shadow:0 0 12px rgba(16,185,129,0.8);"><i class="fa-solid fa-location-arrow"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      routeStartMarker = L.marker([startLat, startLng], { icon: startPinIcon }).addTo(mainLeafletMap);
      routeStartMarker.bindPopup('<strong>📍 Điểm xuất phát của bạn</strong>').openPopup();

      // Fit map bao quát toàn bộ lộ trình
      mainLeafletMap.fitBounds(currentRouteLineLayer.getBounds(), { padding: [50, 50] });

      // 4. Hiển thị bảng Turn-by-Turn Navigation
      displayRouteInfoCard(routeTitle, distKm, durMins, route.legs && route.legs[0] && route.legs[0].steps);

      if (typeof showToast === 'function') {
        showToast(`Đã tìm thấy lộ trình: ${distKm} km (~${durMins} phút)!`, 'success');
      }
    })
    .catch(err => {
      if (overlay) overlay.style.display = 'none';
      console.warn('[MapLocation] Lỗi OSRM Route:', err);
      alert('Không thể vẽ lộ trình tự động. Đang chuyển sang dự phòng Google Maps.');
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}`, '_blank');
    });
}

/**
 * Xóa tuyến đường đang vẽ trên bản đồ
 */
function clearCurrentRoute() {
  if (currentRouteGlowLayer && mainLeafletMap) {
    mainLeafletMap.removeLayer(currentRouteGlowLayer);
    currentRouteGlowLayer = null;
  }
  if (currentRouteLineLayer && mainLeafletMap) {
    mainLeafletMap.removeLayer(currentRouteLineLayer);
    currentRouteLineLayer = null;
  }
  if (routeStartMarker && mainLeafletMap) {
    mainLeafletMap.removeLayer(routeStartMarker);
    routeStartMarker = null;
  }
  const card = document.getElementById('mapRouteInfoCard');
  if (card) card.style.display = 'none';
}

/**
 * Hiển thị thẻ chỉ đường chi tiết từng ngã rẽ
 */
function displayRouteInfoCard(title, distKm, durMins, steps = []) {
  const card = document.getElementById('mapRouteInfoCard');
  const titleEl = document.getElementById('routeCardTitle');
  const distEl = document.getElementById('routeDistanceText');
  const durEl = document.getElementById('routeDurationText');
  const stepsList = document.getElementById('mapRouteStepsList');

  if (!card) return;
  if (titleEl) titleEl.textContent = title;
  if (distEl) distEl.textContent = `${distKm} km`;
  if (durEl) durEl.textContent = `~${durMins} phút`;

  if (stepsList) {
    stepsList.innerHTML = '';
    if (steps && steps.length > 0) {
      steps.forEach((step, idx) => {
        const m = step.maneuver || {};
        const stepDist = step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance / 1000).toFixed(1)} km`;
        const stepDesc = translateManeuverText(m.type, m.modifier, step.name);
        const iconClass = getManeuverIcon(m.type, m.modifier);

        const stepEl = document.createElement('div');
        stepEl.className = 'route-step-item';
        stepEl.innerHTML = `
          <div class="route-step-icon"><i class="${iconClass}"></i></div>
          <div class="route-step-content">
            <div class="route-step-desc">${idx + 1}. ${stepDesc}</div>
            <div class="route-step-dist">${stepDist}</div>
          </div>
        `;
        stepsList.appendChild(stepEl);
      });
    }
  }

  card.style.display = 'flex';
}

/**
 * Dịch chỉ dẫn ngã rẽ từ OSRM sang tiếng Việt tự nhiên
 */
function translateManeuverText(type, modifier, streetName) {
  const street = streetName && streetName.trim() ? streetName : 'đoạn đường tiếp theo';
  if (type === 'depart') return `Bắt đầu xuất phát trên ${street}`;
  if (type === 'arrive') return `Đã đến đích đến: ${street}!`;

  const modMap = {
    'right': 'Rẽ phải vào',
    'left': 'Rẽ trái vào',
    'slight right': 'Chếch sang phải vào',
    'slight left': 'Chếch sang trái vào',
    'sharp right': 'Rẽ ngoặt sang phải vào',
    'sharp left': 'Rẽ ngoặt sang trái vào',
    'straight': 'Tiếp tục đi thẳng trên',
    'uturn': 'Quay đầu xe trên'
  };
  const action = modMap[modifier] || 'Đi vào';
  if (type === 'roundabout') return `Vào bùng binh/vòng xuyến, rẽ ra đường ${street}`;
  if (type === 'fork') return `Đi theo nhánh rẽ vào ${street}`;
  return `${action} ${street}`;
}

function getManeuverIcon(type, modifier) {
  if (type === 'depart') return 'fa-solid fa-play';
  if (type === 'arrive') return 'fa-solid fa-flag-checkered';
  if (modifier === 'right' || modifier === 'slight right' || modifier === 'sharp right') return 'fa-solid fa-arrow-turn-up fa-rotate-90';
  if (modifier === 'left' || modifier === 'slight left' || modifier === 'sharp left') return 'fa-solid fa-arrow-turn-up fa-rotate-270';
  if (modifier === 'uturn') return 'fa-solid fa-arrows-spin';
  return 'fa-solid fa-arrow-up';
}

/**
 * ============================================================================
 * TÌM ĐỊA ĐIỂM XUNG QUANH TRỰC TIẾP TRÊN NAJIMEZ (IN-APP NEARBY PLACES)
 * ============================================================================
 */
function searchAndDisplayNearbyPlaces(keyword, placeType) {
  if (!mainLeafletMap) initMainLeafletMap();
  switchTabToMap();

  const homeData = getSavedHomeLocation();
  const centerLat = (homeData && homeData.lat) || currentPickedLat || DEFAULT_MAP_CENTER[0];
  const centerLng = (homeData && homeData.lng) || currentPickedLng || DEFAULT_MAP_CENTER[1];

  const overlay = document.getElementById('mainMapLoadingOverlay');
  const overlayText = document.getElementById('mainMapLoadingText');
  if (overlay) {
    if (overlayText) overlayText.textContent = `Đang tìm "${keyword}" xung quanh...`;
    overlay.style.display = 'flex';
  }

  // Tra cứu qua Photon API xung quanh tọa độ
  const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(keyword)}&lat=${centerLat}&lon=${centerLng}&limit=12`;

  fetch(photonUrl)
    .then(res => res.json())
    .then(data => {
      if (overlay) overlay.style.display = 'none';
      const features = (data && data.features) || [];
      if (features.length === 0) {
        if (typeof showToast === 'function') {
          showToast(`Không tìm thấy "${keyword}" nào ở khu vực gần đây.`, 'info');
        } else {
          alert(`Không tìm thấy "${keyword}" nào ở khu vực gần đây.`);
        }
        return;
      }

      clearNearbyPlacesMarkers();

      const typeConfig = getPlaceTypeVisual(placeType || keyword);
      const bounds = L.latLngBounds([[centerLat, centerLng]]);

      features.forEach(f => {
        const c = f.geometry && f.geometry.coordinates;
        if (!c || c.length < 2) return;
        const pLat = c[1];
        const pLng = c[0];
        const p = f.properties || {};
        const pName = p.name || keyword;
        const distMeters = calculateHaversineDistance(centerLat, centerLng, pLat, pLng);
        const distStr = distMeters < 1000 ? `${Math.round(distMeters)} m` : `${(distMeters / 1000).toFixed(1)} km`;

        bounds.extend([pLat, pLng]);

        const placeIcon = L.divIcon({
          className: 'custom-place-pin-wrapper',
          html: `<div class="neon-place-marker ${typeConfig.cssClass}" title="${pName}"><i class="${typeConfig.icon}"></i></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([pLat, pLng], { icon: placeIcon }).addTo(mainLeafletMap);

        // Nội dung Popup tương tác
        const popupContent = `
          <div class="place-popup-card">
            <div class="place-popup-title">${pName}</div>
            <div class="place-popup-dist"><i class="fa-solid fa-compass"></i> Cách nhà bạn khoảng <strong>${distStr}</strong></div>
            <button type="button" class="btn-route-to-place" onclick="calculateAndDrawRoute(${centerLat}, ${centerLng}, ${pLat}, ${pLng}, 'Tới: ${pName.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-route"></i> Chỉ đường tới đây ngay
            </button>
          </div>
        `;
        marker.bindPopup(popupContent);
        nearbyPlaceMarkers.push(marker);
      });

      mainLeafletMap.fitBounds(bounds, { padding: [40, 40] });

      if (typeof showToast === 'function') {
        showToast(`Đã tìm thấy ${features.length} địa điểm "${keyword}" trên bản đồ!`, 'success');
      }
    })
    .catch(err => {
      if (overlay) overlay.style.display = 'none';
      console.warn('[MapLocation] Lỗi tìm địa điểm:', err);
      alert('Không thể tra cứu địa điểm lúc này. Vui lòng thử lại sau.');
    });
}

function clearNearbyPlacesMarkers() {
  if (nearbyPlaceMarkers.length > 0 && mainLeafletMap) {
    nearbyPlaceMarkers.forEach(m => mainLeafletMap.removeLayer(m));
    nearbyPlaceMarkers = [];
  }
}

function getPlaceTypeVisual(keyword) {
  const k = (keyword || '').toLowerCase();
  if (k.includes('cà phê') || k.includes('cafe') || k.includes('coffee')) {
    return { icon: 'fa-solid fa-mug-hot', cssClass: 'cafe' };
  }
  if (k.includes('xăng') || k.includes('gas') || k.includes('fuel')) {
    return { icon: 'fa-solid fa-gas-pump', cssClass: 'fuel' };
  }
  if (k.includes('thuốc') || k.includes('dược') || k.includes('pharmacy')) {
    return { icon: 'fa-solid fa-pills', cssClass: 'pharmacy' };
  }
  if (k.includes('siêu thị') || k.includes('mart') || k.includes('chợ')) {
    return { icon: 'fa-solid fa-cart-shopping', cssClass: 'shop' };
  }
  if (k.includes('bệnh viện') || k.includes('phòng khám') || k.includes('hospital')) {
    return { icon: 'fa-solid fa-hospital', cssClass: 'hospital' };
  }
  if (k.includes('quán ăn') || k.includes('nhà hàng') || k.includes('food')) {
    return { icon: 'fa-solid fa-utensils', cssClass: 'food' };
  }
  return { icon: 'fa-solid fa-location-dot', cssClass: 'cafe' };
}

/**
 * Tính khoảng cách đường chim bay theo công thức Haversine (mét)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // bán kính trái đất mét
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Chỉ đường về nhà - Hoạt động TRỰC TIẾP TRÊN NAJIMEZ
 */
function navigateToHome() {
  const homeData = getSavedHomeLocation();
  if (!homeData || !homeData.lat || !homeData.lng) {
    if (typeof showToast === 'function') {
      showToast('Vui lòng ghim vị trí nhà trước khi xem chỉ đường!', 'warning');
    } else {
      alert('Vui lòng ghim vị trí nhà trước khi xem chỉ đường!');
    }
    switchTabToMap();
    return;
  }

  switchTabToMap();

  // Bắt vị trí người dùng đang đứng để vẽ đường về nhà
  if (navigator.geolocation) {
    const overlay = document.getElementById('mainMapLoadingOverlay');
    const overlayText = document.getElementById('mainMapLoadingText');
    if (overlay) {
      if (overlayText) overlayText.textContent = 'Đang xác định vị trí của bạn để vẽ đường về nhà...';
      overlay.style.display = 'flex';
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (overlay) overlay.style.display = 'none';
        const startLat = pos.coords.latitude;
        const startLng = pos.coords.longitude;
        calculateAndDrawRoute(startLat, startLng, homeData.lat, homeData.lng, 'Tuyến Đường Về Nhà');
      },
      () => {
        if (overlay) overlay.style.display = 'none';
        // Nếu không cho GPS, vẽ từ tâm bản đồ hoặc điểm trung tâm mặc định
        const fallbackStartLat = currentPickedLat || DEFAULT_MAP_CENTER[0];
        const fallbackStartLng = currentPickedLng || DEFAULT_MAP_CENTER[1];
        calculateAndDrawRoute(fallbackStartLat, fallbackStartLng, homeData.lat, homeData.lng, 'Tuyến Đường Về Nhà');
      },
      { timeout: 7000 }
    );
  } else {
    const fallbackStartLat = currentPickedLat || DEFAULT_MAP_CENTER[0];
    const fallbackStartLng = currentPickedLng || DEFAULT_MAP_CENTER[1];
    calculateAndDrawRoute(fallbackStartLat, fallbackStartLng, homeData.lat, homeData.lng, 'Tuyến Đường Về Nhà');
  }
}

/**
 * Lưu vị trí từ Main Map làm nhà riêng
 */
function handleSaveFromMainMap() {
  if (!currentPickedLat || !currentPickedLng) {
    alert('Vui lòng chọn vị trí trên bản đồ trước khi lưu!');
    return;
  }

  const addr = currentPickedAddress || `Tọa độ: ${currentPickedLat.toFixed(6)}, ${currentPickedLng.toFixed(6)}`;
  const ok = saveHomeLocationData({
    lat: currentPickedLat,
    lng: currentPickedLng,
    address: addr,
    updatedAt: Date.now()
  });

  if (ok && typeof showToast === 'function') {
    showToast('Đã lưu vị trí Nhà Riêng thành công trên Najimez!', 'success');
  }
}

/**
 * Xóa vị trí nhà riêng đã lưu
 */
function handleClearHomeLocation() {
  const confirmDel = confirm('Bạn có chắc chắn muốn xóa vị trí Nhà Riêng đã lưu không?');
  if (!confirmDel) return;

  localStorage.removeItem(HOME_LOC_STORAGE_KEY);
  clearCurrentRoute();
  clearNearbyPlacesMarkers();
  updateHomeLocationUI();
  updateMainMapWorkspaceUI();
  if (typeof showToast === 'function') {
    showToast('Đã xóa vị trí Nhà Riêng.', 'info');
  }
}

/**
 * Hàm gọi khi chuyển sang tab Bản Đồ (tab-map)
 */
function renderMapTab() {
  setTimeout(() => {
    initMainLeafletMap();
    if (mainLeafletMap) {
      mainLeafletMap.invalidateSize();
      const homeData = getSavedHomeLocation();
      if (homeData && homeData.lat && homeData.lng) {
        mainLeafletMap.setView([homeData.lat, homeData.lng], 16);
      }
    }
    updateMainMapWorkspaceUI();
  }, 100);
}

/**
 * Khởi tạo toàn bộ module Vị Trí & Bản Đồ
 */
function initHomeLocationModule() {
  updateHomeLocationUI();
  updateMainMapWorkspaceUI();

  // Khởi tạo mini map khi rảnh rỗi
  setTimeout(() => {
    initInlineMiniMap();
  }, 600);

  // Nút trên Thẻ Hộp Dụng Cụ
  const btnOpenFullMap = document.getElementById('btnOpenFullMapFromCard');
  const btnDirections = document.getElementById('btnDirectionsHome');
  const btnQuickGps = document.getElementById('btnQuickGpsHome');
  const btnClear = document.getElementById('btnClearHomeLoc');
  const btnRefresh = document.getElementById('btnQuickRefreshHome');

  if (btnOpenFullMap) btnOpenFullMap.addEventListener('click', switchTabToMap);
  if (btnDirections) btnDirections.addEventListener('click', navigateToHome);
  if (btnQuickGps) btnQuickGps.addEventListener('click', locateViaGPSOnMainMap);
  if (btnClear) btnClear.addEventListener('click', handleClearHomeLocation);
  if (btnRefresh) btnRefresh.addEventListener('click', updateHomeLocationUI);

  // Nút trên Main Map Workspace (tab-map)
  const btnSaveMain = document.getElementById('btnSaveFromMainMap');
  const btnNavMain = document.getElementById('btnNavigateFromMainMap');
  const btnGpsMain = document.getElementById('btnGpsFromMainMap');
  const btnClearMain = document.getElementById('btnClearFromMainMap');
  const btnHudGps = document.getElementById('btnMainMapGps');
  const btnHudDir = document.getElementById('btnMainMapDirections');
  const btnCloseRoute = document.getElementById('btnCloseRoute');

  if (btnSaveMain) btnSaveMain.addEventListener('click', handleSaveFromMainMap);
  if (btnNavMain) btnNavMain.addEventListener('click', navigateToHome);
  if (btnGpsMain) btnGpsMain.addEventListener('click', locateViaGPSOnMainMap);
  if (btnClearMain) btnClearMain.addEventListener('click', handleClearHomeLocation);
  if (btnHudGps) btnHudGps.addEventListener('click', locateViaGPSOnMainMap);
  if (btnHudDir) btnHudDir.addEventListener('click', navigateToHome);
  if (btnCloseRoute) btnCloseRoute.addEventListener('click', clearCurrentRoute);

  // Nút chuyển chế độ xem bản đồ (Đường phố, Vệ tinh, Ban đêm)
  const layerPills = document.querySelectorAll('.btn-layer-pill');
  layerPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const layer = pill.dataset.layer;
      if (layer) switchMainMapLayer(layer);
    });
  });

  // Tìm kiếm trên Main Map
  const searchInput = document.getElementById('mainMapSearchInput');
  const btnSearch = document.getElementById('btnMainMapSearch');
  const btnClearSearch = document.getElementById('btnMainMapClearSearch');

  if (btnSearch && searchInput) {
    btnSearch.addEventListener('click', () => searchMainMapAddress(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchMainMapAddress(searchInput.value);
      }
    });

    searchInput.addEventListener('input', () => {
      if (btnClearSearch) btnClearSearch.style.display = searchInput.value ? 'block' : 'none';
      clearTimeout(searchDebounceTimeout);
      if (searchInput.value.trim().length >= 3) {
        searchDebounceTimeout = setTimeout(() => {
          searchMainMapAddress(searchInput.value);
        }, 500);
      } else {
        const res = document.getElementById('mainMapSearchResults');
        if (res) res.style.display = 'none';
      }
    });
  }

  if (btnClearSearch && searchInput) {
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      btnClearSearch.style.display = 'none';
      const res = document.getElementById('mainMapSearchResults');
      if (res) res.style.display = 'none';
    });
  }

  // Chips tìm địa điểm xung quanh trực tiếp trên Najimez
  const placeChips = document.querySelectorAll('.map-place-chip');
  placeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.query;
      if (q) searchAndDisplayNearbyPlaces(q, q);
    });
  });
}

// Xuất ra global scope
window.getSavedHomeLocation = getSavedHomeLocation;
window.saveHomeLocationData = saveHomeLocationData;
window.updateHomeLocationUI = updateHomeLocationUI;
window.updateMainMapWorkspaceUI = updateMainMapWorkspaceUI;
window.renderMapTab = renderMapTab;
window.navigateToHome = navigateToHome;
window.switchTabToMap = switchTabToMap;
window.switchMainMapLayer = switchMainMapLayer;
window.calculateAndDrawRoute = calculateAndDrawRoute;
window.clearCurrentRoute = clearCurrentRoute;
window.searchAndDisplayNearbyPlaces = searchAndDisplayNearbyPlaces;
window.initHomeLocationModule = initHomeLocationModule;
