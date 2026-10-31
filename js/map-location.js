/**
 * js/map-location.js - Quản lý Trung Tâm Bản Đồ & Vị Trí Nhà Riêng Najimez
 * Sử dụng Google Maps Tiles, OSRM In-App Routing, Photon Nearby Places & Leaflet.js
 * Hoạt động 100% TRỰC TIẾP TRÊN NAJIMEZ - Không chuyển trang hay redirect
 * Chuẩn Code Modularization cho Dự Án Trợ Lý Ảo Najimez
 */

const HOME_LOC_STORAGE_KEY = 'najimez_home_location';
const LAST_GPS_STORAGE_KEY = 'najimez_last_known_gps';
const DEFAULT_MAP_CENTER = [10.762622, 106.660172]; // TP. Hồ Chí Minh
const DEFAULT_MAP_ZOOM = 16;

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
let droppedPinMarker = null;

// Quản lý Live GPS Navigation Tracking thời gian thực & Bám theo vị trí
let liveGpsWatchId = null;
let userLiveCoords = null; // { lat, lng, accuracy, heading, speed, timestamp }
let isFollowUserMode = true; // Mặc định tự động bám theo Chấm Xanh khi đi đường
let tempPickedPinCoords = null; // Tọa độ ghim tạm thời khi người dùng chủ động chọn trên bản đồ

// Quản lý các ghim địa điểm tìm kiếm xung quanh (Nearby Places)
let nearbyPlaceMarkers = [];

let currentPickedLat = null;
let currentPickedLng = null;
let currentPickedAddress = '';
let searchDebounceTimeout = null;

/**
 * Đọc tọa độ GPS gần nhất từ localStorage
 */
function getLastKnownGpsLocation() {
  try {
    const raw = localStorage.getItem(LAST_GPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return parsed;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Lưu tọa độ GPS mới nhất vào localStorage
 */
function saveLastKnownGpsLocation(lat, lng, accuracy = 0) {
  try {
    localStorage.setItem(LAST_GPS_STORAGE_KEY, JSON.stringify({
      lat,
      lng,
      accuracy,
      time: Date.now()
    }));
  } catch (_) {}
}

/**
 * Cập nhật giao diện trạng thái bám theo vị trí (Follow Me UI)
 */
function updateGpsFollowUI(isActive) {
  const floatBtn = document.getElementById('btnMapFloatingGps');
  const hudBtn = document.getElementById('btnMainMapGps');
  if (floatBtn) {
    floatBtn.classList.toggle('active', isActive);
    floatBtn.setAttribute('title', isActive 
      ? 'Đang bám theo vị trí của bạn khi đi đường (Nhấp để tắt bám theo)' 
      : 'Bật chế độ bám theo vị trí của bạn');
  }
  if (hudBtn) {
    hudBtn.classList.toggle('live-tracking', isActive);
  }
}

/**
 * Xóa ghim tạm trên bản đồ và đóng popup
 */
function clearDroppedPin() {
  if (droppedPinMarker && mainLeafletMap) {
    try {
      droppedPinMarker.closePopup();
      mainLeafletMap.removeLayer(droppedPinMarker);
    } catch (_) {}
    droppedPinMarker = null;
  }
  tempPickedPinCoords = null;
}

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

    if (typeof triggerAutoSyncToCloud === 'function') {
      triggerAutoSyncToCloud();
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
  loadSavedPlaces();
  renderSavedPlacesListUI();
  if (mainLeafletMap) {
    renderAllSavedPlaceMarkers();
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

  // Ưu tiên: Vị trí GPS gần nhất của người dùng -> Vị trí nhà riêng -> TP.HCM
  const lastGps = getLastKnownGpsLocation();
  const homeData = getSavedHomeLocation();
  const initialCenter = (lastGps && typeof lastGps.lat === 'number' && typeof lastGps.lng === 'number')
    ? [lastGps.lat, lastGps.lng]
    : ((homeData && homeData.lat && homeData.lng) ? [homeData.lat, homeData.lng] : DEFAULT_MAP_CENTER);
  const initialZoom = 17;

  mainLeafletMap = L.map('mainLeafletMap', {
    center: initialCenter,
    zoom: initialZoom,
    zoomControl: true
  });

  const cfg = MAP_LAYERS[currentLayerKey] || MAP_LAYERS['google-street'];
  currentMainTileLayer = L.tileLayer(cfg.url, cfg.options).addTo(mainLeafletMap);

  // Chấm xanh Google Maps hiển thị vị trí của tôi (Chuẩn Google Maps, KHÔNG kéo thả)
  const myLocationDivIcon = L.divIcon({
    className: 'custom-gmap-dot-wrapper',
    html: `
      <div class="gmap-my-location-marker" title="Vị trí của bạn">
        <div class="gmap-blue-dot-halo"></div>
        <div class="gmap-blue-dot-core"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  mainHomeMarker = L.marker(initialCenter, {
    icon: myLocationDivIcon,
    draggable: false // Cố định, không cầm nắm kéo rê
  }).addTo(mainLeafletMap);

  currentPickedLat = initialCenter[0];
  currentPickedLng = initialCenter[1];

  // Khi người dùng chủ động vuốt/kéo bản đồ, tạm tắt chế độ tự động bám theo để tự do xem map
  mainLeafletMap.on('dragstart', () => {
    if (isFollowUserMode) {
      isFollowUserMode = false;
      updateGpsFollowUI(false);
    }
  });

  // Khi nhấp vào bản đồ: Nếu có ghim tạm thì xóa bỏ, hoặc tạo ghim mới mà KHÔNG bung popup tự động đập vào mắt
  mainLeafletMap.on('click', (e) => {
    handleMapClickToPickLocation(e.latlng.lat, e.latlng.lng);
  });

  if (homeData && homeData.address) {
    currentPickedAddress = homeData.address;
  }

  // Nạp và cắm ghim toàn bộ các địa điểm đã lưu lên bản đồ
  loadSavedPlaces();
  renderAllSavedPlaceMarkers();

  // Tự động kích hoạt Live GPS Tracking liên tục ngay khi nạp map
  startLiveGpsTracking(true);
  updateGpsFollowUI(true);
}

/**
 * Xử lý khi click chuột trên bản đồ để chọn một địa điểm bất kỳ
 * Thông minh: Nếu đã có ghim tạm thì chạm vào map sẽ dọn sạch ghim (Clear).
 * Không tự động bung popup đè màn hình gây phiền toái cho người dùng.
 */
function handleMapClickToPickLocation(lat, lng, autoOpenPopup = false) {
  // Nếu người dùng nhấp vào bản đồ khi đã có ghim tạm đỏ, xóa ghim và thoát (Dọn sạch map)
  if (droppedPinMarker && !autoOpenPopup) {
    clearDroppedPin();
    return;
  }

  tempPickedPinCoords = { lat: lat, lng: lng, address: '' };

  const droppedPinIcon = L.divIcon({
    className: 'custom-dropped-pin-wrapper',
    html: '<div class="gmap-dropped-pin" title="Điểm đã chọn (Nhấp để xem hoặc lưu)"><i class="fa-solid fa-location-dot"></i></div>',
    iconSize: [32, 38],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36]
  });

  if (!droppedPinMarker) {
    droppedPinMarker = L.marker([lat, lng], { icon: droppedPinIcon }).addTo(mainLeafletMap);
  } else {
    droppedPinMarker.setLatLng([lat, lng]);
    if (!mainLeafletMap.hasLayer(droppedPinMarker)) {
      droppedPinMarker.addTo(mainLeafletMap);
    }
  }

  reverseGeocodeLocation(lat, lng, (resolved) => {
    if (tempPickedPinCoords) tempPickedPinCoords.address = resolved;
    if (droppedPinMarker) {
      droppedPinMarker.bindPopup(`
        <div class="dropped-pin-popup">
          <div class="dropped-pin-title"><i class="fa-solid fa-location-dot" style="color:#ef4444;"></i> Điểm Đã Chọn</div>
          <div class="dropped-pin-addr">${escapeHtml(resolved)}</div>
          <div style="display:flex;gap:6px;margin-top:8px;">
            <button type="button" class="btn-save-dropped-pin" onclick="window.openAddSavedPlaceModal()" style="flex:1;">
              <i class="fa-solid fa-plus"></i> Lưu Địa Điểm Này
            </button>
            <button type="button" class="btn-save-dropped-pin" onclick="window.clearDroppedPin()" style="background:#475569;flex:initial;padding:0 10px;" title="Xóa ghim này">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      `);

      // Chỉ mở popup nếu có cờ yêu cầu (ví dụ khi tìm kiếm địa chỉ cụ thể)
      if (autoOpenPopup) {
        droppedPinMarker.openPopup();
      }
    }
  });
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
    className: 'custom-gmap-dot-wrapper',
    html: `
      <div class="gmap-my-location-marker" style="width:26px;height:26px;" title="Vị trí của bạn">
        <div class="gmap-blue-dot-halo" style="width:24px;height:24px;"></div>
        <div class="gmap-blue-dot-core" style="width:11px;height:11px;border-width:2px;"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  inlineHomeMarker = L.marker(initialCenter, { icon: miniDivIcon, draggable: false }).addTo(inlineMiniMap);

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
  let match = cleanQ.match(coordsRegex);
  let pLat = null;
  let pLng = null;

  if (match) {
    pLat = parseFloat(match[1]);
    pLng = parseFloat(match[2]);
  } else {
    // Thử bắt tọa độ DMS (Độ Phút Giây: VD 10°48'22.3"N 106°55'38.6"E)
    const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([NSns])?[,\s]+(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([EWew])?/;
    const dmsMatch = cleanQ.match(dmsRegex);
    if (dmsMatch) {
      const latDeg = parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60 + (parseFloat(dmsMatch[3]) || 0) / 3600;
      const latDir = (dmsMatch[4] || 'N').toUpperCase();
      pLat = latDir === 'S' ? -latDeg : latDeg;

      const lngDeg = parseFloat(dmsMatch[5]) + parseFloat(dmsMatch[6]) / 60 + (parseFloat(dmsMatch[7]) || 0) / 3600;
      const lngDir = (dmsMatch[8] || 'E').toUpperCase();
      pLng = lngDir === 'W' ? -lngDeg : lngDeg;
    }
  }

  if (pLat !== null && pLng !== null && pLat >= -90 && pLat <= 90 && pLng >= -180 && pLng <= 180) {
    handleMapClickToPickLocation(pLat, pLng, true);
    if (mainLeafletMap) mainLeafletMap.setView([pLat, pLng], 18);
    const resultsDropdown = document.getElementById('mainMapSearchResults');
    if (resultsDropdown) resultsDropdown.style.display = 'none';
    if (typeof showToast === 'function') {
      showToast(`Đã chọn tọa độ: ${pLat.toFixed(6)}, ${pLng.toFixed(6)}!`, 'success');
    }
    return;
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
      handleMapClickToPickLocation(item.lat, item.lng, true);
      if (mainLeafletMap) mainLeafletMap.setView([item.lat, item.lng], 17);
      resultsDropdown.style.display = 'none';
      const searchInput = document.getElementById('mainMapSearchInput');
      if (searchInput) searchInput.value = item.displayName;
    });
    resultsDropdown.appendChild(itemEl);
  });
}

/**
 * Khởi chạy Live GPS Navigation Tracking liên tục thời gian thực (Chuẩn Google Maps)
 * Không tự ngắt, liên tục theo dõi vị trí khi di chuyển xe máy / đi bộ
 */
function startLiveGpsTracking(forceCenter = false) {
  if (!navigator.geolocation) {
    console.warn('[MapLocation] Trình duyệt không hỗ trợ Geolocation.');
    return;
  }

  // Nếu đã có tọa độ và yêu cầu forceCenter, căn giữa camera ngay
  if (forceCenter && userLiveCoords && mainLeafletMap) {
    mainLeafletMap.panTo([userLiveCoords.lat, userLiveCoords.lng], { animate: true, duration: 0.6 });
  }

  // Nếu watchId đang hoạt động, không khởi tạo lặp
  if (liveGpsWatchId !== null) return;

  liveGpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = pos.coords.accuracy || 0;
      const heading = pos.coords.heading;
      const speed = pos.coords.speed;

      userLiveCoords = {
        lat: lat,
        lng: lng,
        accuracy: acc,
        heading: heading,
        speed: speed,
        timestamp: Date.now()
      };

      // Lưu lại tọa độ GPS gần nhất để mở lại ngay trong lần sau
      saveLastKnownGpsLocation(lat, lng, acc);

      // Cập nhật vị trí Chấm Xanh Google Maps trên bản đồ
      if (mainHomeMarker) {
        mainHomeMarker.setLatLng([lat, lng]);
      }

      // Cập nhật vòng tròn mờ hiển thị bán kính sai số thực tế quanh Chấm Xanh
      if (mainLeafletMap) {
        const safeRadius = Math.max(acc, 8);
        if (!userGpsAccuracyCircle) {
          userGpsAccuracyCircle = L.circle([lat, lng], {
            radius: safeRadius,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '3, 4',
            interactive: false
          }).addTo(mainLeafletMap);
        } else {
          userGpsAccuracyCircle.setLatLng([lat, lng]);
          userGpsAccuracyCircle.setRadius(safeRadius);
          if (!mainLeafletMap.hasLayer(userGpsAccuracyCircle)) {
            userGpsAccuracyCircle.addTo(mainLeafletMap);
          }
        }
      }

      // Chế độ Bám Theo Vị Trí (Follow Me Mode) khi đi đường:
      // Tự động lướt camera giữ Chấm Xanh ở trung tâm
      if (isFollowUserMode && mainLeafletMap) {
        mainLeafletMap.panTo([lat, lng], { animate: true, duration: 0.6 });
      }

      updateGpsFollowUI(isFollowUserMode);

      // Tắt màn hình chờ nếu có
      const overlay = document.getElementById('mainMapLoadingOverlay');
      if (overlay && overlay.dataset.temporaryGpsLoading === 'true') {
        overlay.style.display = 'none';
        delete overlay.dataset.temporaryGpsLoading;
      }
    },
    (err) => {
      console.warn('[MapLocation] Lỗi Live GPS Watch:', err.message);
      updateGpsFollowUI(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 1000 // Tối đa 1 giây cache, đảm bảo cập nhật liên tục khi di chuyển
    }
  );
}

/**
 * Định vị GPS qua trình duyệt trên Main Map
 * Kích hoạt chế độ bám theo vị trí (Follow Me), bay camera về Chấm Xanh và dọn sạch ghim lạ
 */
function locateViaGPSOnMainMap(centerNow = true) {
  if (!navigator.geolocation) {
    alert('Trình duyệt của bạn không hỗ trợ định vị GPS!');
    return;
  }

  // Bật chế độ bám theo vị trí
  isFollowUserMode = true;
  updateGpsFollowUI(true);

  // Xóa bỏ bất kỳ ghim lạ nào đang hiển thị
  clearDroppedPin();

  // Đảm bảo Live GPS Tracking đang chạy liên tục
  startLiveGpsTracking(false);

  // Nếu đã có tọa độ thời gian thực, bay ngay về tâm Chấm Xanh
  if (userLiveCoords && mainLeafletMap && centerNow) {
    mainLeafletMap.setView([userLiveCoords.lat, userLiveCoords.lng], Math.max(mainLeafletMap.getZoom(), 17), { animate: true });
    if (typeof showToast === 'function') {
      showToast('Đang bám theo vị trí của bạn theo thời gian thực!', 'success');
    }
    return;
  }

  // Nếu chưa có tọa độ, hiển thị loading nhẹ và lấy ngay vị trí tức thì
  const overlay = document.getElementById('mainMapLoadingOverlay');
  const overlayText = document.getElementById('mainMapLoadingText');
  if (overlay) {
    if (overlayText) overlayText.textContent = 'Đang kết nối GPS và định vị chính xác...';
    overlay.dataset.temporaryGpsLoading = 'true';
    overlay.style.display = 'flex';
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (overlay) {
        overlay.style.display = 'none';
        delete overlay.dataset.temporaryGpsLoading;
      }
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = pos.coords.accuracy || 0;

      userLiveCoords = {
        lat: lat,
        lng: lng,
        accuracy: acc,
        timestamp: Date.now()
      };
      saveLastKnownGpsLocation(lat, lng, acc);

      if (mainHomeMarker) {
        mainHomeMarker.setLatLng([lat, lng]);
      }
      if (mainLeafletMap && centerNow) {
        mainLeafletMap.setView([lat, lng], 17, { animate: true });
      }

      startLiveGpsTracking(true);
      updateGpsFollowUI(true);

      if (typeof showToast === 'function') {
        showToast('Đã định vị chính xác và bật chế độ bám theo khi đi đường!', 'success');
      }
    },
    (err) => {
      if (overlay) {
        overlay.style.display = 'none';
        delete overlay.dataset.temporaryGpsLoading;
      }
      console.warn('[MapLocation] Lỗi GPS getCurrentPosition:', err.message);
      updateGpsFollowUI(false);
      alert('Không thể lấy vị trí GPS. Hãy kiểm tra quyền truy cập vị trí trên trình duyệt của bạn!');
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    }
  );
}

/**
 * Hộp thoại hỗ trợ dán tọa độ Google Maps từ điện thoại hoặc link
 */
async function promptPasteCoordinates() {
  let initialVal = '';
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && (clipText.includes(',') || clipText.includes('google') || /\d+\.\d+/.test(clipText))) {
        initialVal = clipText.trim();
      }
    } catch (_) {}
  }

  const promptVal = prompt(
    'Dán tọa độ (ví dụ: 10.8062, 106.9274) hoặc link Google Maps từ điện thoại vào đây:\n(Najimez sẽ bay tới đúng vị trí và phóng to nóc nhà của bạn)',
    initialVal
  );
  if (!promptVal || !promptVal.trim()) return;

  const searchInput = document.getElementById('mainMapSearchInput');
  if (searchInput) searchInput.value = promptVal.trim();
  searchMainMapAddress(promptVal.trim());
}

/**
 * Lấy tọa độ Chấm Xanh Google Maps (Vị trí hiện tại của người dùng)
 * Ưu tiên: Tọa độ GPS Live thời gian thực -> Tọa độ GPS gần nhất -> Marker -> Nhà -> Mặc định
 */
function getMyLocationCoords() {
  if (userLiveCoords && typeof userLiveCoords.lat === 'number' && typeof userLiveCoords.lng === 'number') {
    return [userLiveCoords.lat, userLiveCoords.lng];
  }
  const lastGps = getLastKnownGpsLocation();
  if (lastGps && typeof lastGps.lat === 'number' && typeof lastGps.lng === 'number') {
    return [lastGps.lat, lastGps.lng];
  }
  if (mainHomeMarker && mainHomeMarker.getLatLng) {
    const cur = mainHomeMarker.getLatLng();
    if (cur && cur.lat && cur.lng) {
      return [cur.lat, cur.lng];
    }
  }
  const homeData = getSavedHomeLocation();
  if (homeData && homeData.lat && homeData.lng) {
    return [homeData.lat, homeData.lng];
  }
  return DEFAULT_MAP_CENTER;
}

/**
 * ============================================================================
 * CHỈ ĐƯỜNG TRỰC TIẾP TRÊN NAJIMEZ (IN-APP NAVIGATION - OSRM ROUTING)
 * ============================================================================
 */
function calculateAndDrawRoute(startLat, startLng, endLat, endLng, routeTitle = 'Tuyến Đường Về Nhà') {
  if (!mainLeafletMap) initMainLeafletMap();
  switchTabToMap();

  // 1. Đồng bộ tuyệt đối: Di chuyển Chấm Xanh Google Maps về đúng vị trí xuất phát
  if (mainHomeMarker) {
    mainHomeMarker.setLatLng([startLat, startLng]);
  }
  currentPickedLat = startLat;
  currentPickedLng = startLng;

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
      let latlngs = (route.geometry.coordinates || []).map(coord => [coord[1], coord[0]]);

      // NỐI LIỀN MẠCH TỪ CHÍNH TÂM CHẤM XANH CỦA BẠN ĐẾN ĐÍCH ĐẾN:
      if (latlngs.length > 0) {
        // Nối thẳng từ tâm Chấm Xanh [startLat, startLng] vào điểm đầu OSRM (tránh đứt đoạn ra ngõ)
        const dStart = calculateHaversineDistance(startLat, startLng, latlngs[0][0], latlngs[0][1]);
        if (dStart > 2) {
          latlngs.unshift([startLat, startLng]);
        }
        // Nối thẳng từ điểm cuối OSRM vào tâm đích đến [endLat, endLng]
        const lastIdx = latlngs.length - 1;
        const dEnd = calculateHaversineDistance(endLat, endLng, latlngs[lastIdx][0], latlngs[lastIdx][1]);
        if (dEnd > 2) {
          latlngs.push([endLat, endLng]);
        }
      }

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

      // Fit map bao quát toàn bộ lộ trình
      mainLeafletMap.fitBounds(currentRouteLineLayer.getBounds(), { padding: [50, 50] });

      // 3. Hiển thị bảng Turn-by-Turn Navigation
      displayRouteInfoCard(routeTitle, distKm, durMins, route.legs && route.legs[0] && route.legs[0].steps, startLat, startLng, endLat, endLng);

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
function displayRouteInfoCard(title, distKm, durMins, steps = [], startLat = null, startLng = null, endLat = null, endLng = null) {
  const card = document.getElementById('mapRouteInfoCard');
  const titleEl = document.getElementById('routeCardTitle');
  const distEl = document.getElementById('routeDistanceText');
  const durEl = document.getElementById('routeDurationText');
  const stepsList = document.getElementById('mapRouteStepsList');
  const btnGmaps = document.getElementById('btnOpenGmapDirections');

  if (!card) return;
  if (titleEl) titleEl.textContent = title;
  if (distEl) distEl.textContent = `${distKm} km`;
  if (durEl) durEl.textContent = `~${durMins} phút`;

  // Cập nhật link dẫn đường Google Maps với chế độ Xe Máy (two_wheeler)
  if (btnGmaps && startLat && startLng && endLat && endLng) {
    btnGmaps.href = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=two_wheeler`;
  }

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
            <button type="button" class="btn-route-to-place" onclick="window.routeToCoordinates(${pLat}, ${pLng}, 'Tới: ${pName.replace(/'/g, "\\'")}')">
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

  const startCoords = getMyLocationCoords();
  // Nếu Chấm Xanh đang đứng cách nhà > 15m, vẽ đường từ chính Chấm Xanh về nhà
  const dist = calculateHaversineDistance(startCoords[0], startCoords[1], homeData.lat, homeData.lng);
  if (dist > 15) {
    calculateAndDrawRoute(startCoords[0], startCoords[1], homeData.lat, homeData.lng, 'Tuyến Đường Về Nhà');
    return;
  }

  // Nếu Chấm Xanh đang trùng khít với nhà hoặc chưa xác định, xin GPS mới nhất
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
        if (mainHomeMarker) mainHomeMarker.setLatLng([startLat, startLng]);
        currentPickedLat = startLat;
        currentPickedLng = startLng;
        calculateAndDrawRoute(startLat, startLng, homeData.lat, homeData.lng, 'Tuyến Đường Về Nhà');
      },
      () => {
        if (overlay) overlay.style.display = 'none';
        const fallbackStartLat = currentPickedLat || DEFAULT_MAP_CENTER[0];
        const fallbackStartLng = currentPickedLng || DEFAULT_MAP_CENTER[1];
        calculateAndDrawRoute(fallbackStartLat, fallbackStartLng, homeData.lat, homeData.lng, 'Tuyến Đường Về Nhà');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  } else {
    const fallbackStartLat = currentPickedLat || DEFAULT_MAP_CENTER[0];
    const fallbackStartLng = currentPickedLng || DEFAULT_MAP_CENTER[1];
    calculateAndDrawRoute(fallbackStartLat, fallbackStartLng, homeData.lat, homeData.lng, 'Tuyến Đường Về Nhà');
  }
}

/**
 * ============================================================================
 * QUẢN LÝ ĐỊA ĐIỂM ĐÃ LƯU (SAVED PLACES WORKSPACE)
 * ============================================================================
 */
const SAVED_PLACES_STORAGE_KEY = 'NAJIMEZ_SAVED_PLACES_V1';
let savedPlaces = [];
const savedPlaceMarkersMap = new Map();

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPlaceTypeInfo(type) {
  const map = {
    general: { icon: 'fa-solid fa-location-dot', label: 'Chung', color: '#0ea5e9' },
    home:    { icon: 'fa-solid fa-house-chimney', label: 'Nhà riêng', color: '#38bdf8' },
    cafe:    { icon: 'fa-solid fa-mug-hot', label: 'Cà phê', color: '#f59e0b' },
    work:    { icon: 'fa-solid fa-briefcase', label: 'Công ty', color: '#a855f7' },
    food:    { icon: 'fa-solid fa-utensils', label: 'Quán ăn', color: '#f43f5e' },
    shop:    { icon: 'fa-solid fa-cart-shopping', label: 'Mua sắm', color: '#10b981' },
    star:    { icon: 'fa-solid fa-star', label: 'Yêu thích', color: '#eab308' }
  };
  return map[type] || map.general;
}

function formatPlaceTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${mins} - ${day}/${month}/${year}`;
}

function loadSavedPlaces() {
  try {
    const raw = localStorage.getItem(SAVED_PLACES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        savedPlaces = parsed;
        return savedPlaces;
      }
    }
  } catch (e) {
    console.warn('[MapLocation] Lỗi đọc saved places:', e);
  }
  savedPlaces = [];
  return savedPlaces;
}

function saveSavedPlacesList(list) {
  savedPlaces = list;
  try {
    localStorage.setItem(SAVED_PLACES_STORAGE_KEY, JSON.stringify(savedPlaces));
    if (typeof triggerAutoSyncToCloud === 'function') {
      triggerAutoSyncToCloud();
    }
  } catch (e) {
    console.error('[MapLocation] Lỗi lưu saved places:', e);
  }
}

function renderSavedPlacesListUI() {
  const badge = document.getElementById('savedPlacesCountBadge');
  const listEl = document.getElementById('savedPlacesList');
  if (badge) {
    badge.textContent = `${savedPlaces.length} địa điểm`;
  }
  if (!listEl) return;

  if (savedPlaces.length === 0) {
    listEl.innerHTML = `
      <div class="saved-places-empty">
        <div class="empty-icon"><i class="fa-solid fa-map-location-dot"></i></div>
        <div class="empty-title">Chưa có địa điểm đã lưu</div>
        <div class="empty-desc">Nhấp chuột trên bản đồ để chọn vị trí, sau đó bấm <strong>"Thêm Vị Trí Hiện Tại"</strong> ở trên để lưu lại nhé!</div>
      </div>
    `;
    return;
  }

  const curLoc = getMyLocationCoords();

  listEl.innerHTML = savedPlaces.map(place => {
    const typeInfo = getPlaceTypeInfo(place.type);
    const addrDisplay = place.address || `Tọa độ: ${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`;
    return `
      <div class="saved-place-item" data-id="${place.id}">
        <div class="place-item-top">
          <div class="place-item-icon-tag type-${place.type || 'general'}" title="${typeInfo.label}">
            <i class="${typeInfo.icon}"></i>
          </div>
          <div class="place-item-main">
            <div class="place-item-name" title="${escapeHtml(place.name)}">${escapeHtml(place.name)}</div>
            <div class="place-item-time"><i class="fa-regular fa-clock"></i> ${formatPlaceTime(place.createdAt)}</div>
          </div>
          <button type="button" class="btn-del-place" data-id="${place.id}" title="Xóa địa điểm này">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>

        <div class="place-item-addr" title="${escapeHtml(addrDisplay)}">
          <i class="fa-solid fa-location-dot"></i>
          <span>${escapeHtml(addrDisplay)}</span>
        </div>

        ${place.notes ? `
          <div class="place-item-notes">
            <i class="fa-regular fa-note-sticky"></i>
            <span>${escapeHtml(place.notes)}</span>
          </div>
        ` : ''}

        <div class="place-item-actions">
          <button type="button" class="btn-place-pan" data-id="${place.id}">
            <i class="fa-solid fa-crosshairs"></i> Xem Trên Map
          </button>
          <button type="button" class="btn-place-route" data-id="${place.id}">
            <i class="fa-solid fa-route"></i> Chỉ Đường
          </button>
          <a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(curLoc[0] + ',' + curLoc[1])}&destination=${place.lat},${place.lng}&travelmode=two_wheeler" target="_blank" rel="noopener noreferrer" class="btn-place-gmaps" title="Mở ứng dụng Google Maps dẫn đường xe máy">
            <i class="fa-solid fa-diamond-turn-right"></i> GG Maps
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Bắt sự kiện
  listEl.querySelectorAll('.saved-place-item').forEach(card => {
    const placeId = card.dataset.id;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-del-place') || e.target.closest('.btn-place-route')) return;
      focusSavedPlaceOnMap(placeId);
    });
  });

  listEl.querySelectorAll('.btn-del-place').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSavedPlace(btn.dataset.id);
    });
  });

  listEl.querySelectorAll('.btn-place-pan').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      focusSavedPlaceOnMap(btn.dataset.id);
    });
  });

  listEl.querySelectorAll('.btn-place-route').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      routeToSavedPlace(btn.dataset.id);
    });
  });
}

function renderAllSavedPlaceMarkers() {
  if (!mainLeafletMap) return;

  savedPlaceMarkersMap.forEach(marker => {
    try { mainLeafletMap.removeLayer(marker); } catch (_) {}
  });
  savedPlaceMarkersMap.clear();

  savedPlaces.forEach(place => {
    const typeInfo = getPlaceTypeInfo(place.type);
    const divIcon = L.divIcon({
      className: 'custom-saved-pin-wrapper',
      html: `<div class="saved-place-neon-marker type-${place.type || 'general'}" title="${escapeHtml(place.name)}"><i class="${typeInfo.icon}"></i></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });

    const marker = L.marker([place.lat, place.lng], { icon: divIcon }).addTo(mainLeafletMap);

    const addrDisplay = place.address || `Tọa độ: ${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`;
    const curLoc = getMyLocationCoords();
    const popupContent = `
      <div class="saved-place-popup">
        <div class="popup-place-header">
          <i class="${typeInfo.icon}" style="color: ${typeInfo.color};"></i>
          <strong>${escapeHtml(place.name)}</strong>
        </div>
        <div class="popup-place-addr">${escapeHtml(addrDisplay)}</div>
        ${place.notes ? `<div class="popup-place-notes"><em>"${escapeHtml(place.notes)}"</em></div>` : ''}
        <div class="popup-place-footer">
          <span class="popup-time">${formatPlaceTime(place.createdAt)}</span>
          <div style="display:flex;gap:5px;align-items:center;">
            <button type="button" class="popup-btn-route" onclick="window.routeToSavedPlace('${place.id}')">
              <i class="fa-solid fa-route"></i> Chỉ đường
            </button>
            <a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(curLoc[0] + ',' + curLoc[1])}&destination=${place.lat},${place.lng}&travelmode=two_wheeler" target="_blank" rel="noopener noreferrer" style="background:#16a34a;color:#fff;border-radius:5px;padding:4px 7px;font-size:0.72rem;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:3px;" title="Mở Google Maps dẫn đường xe máy">
              <i class="fa-solid fa-diamond-turn-right"></i> GG Maps
            </a>
          </div>
        </div>
      </div>
    `;
    marker.bindPopup(popupContent);
    savedPlaceMarkersMap.set(place.id, marker);
  });
}

let modalTargetCoords = null;

function openAddSavedPlaceModal() {
  let lat = null;
  let lng = null;
  let addrHint = '';

  // Ưu tiên 1: Nếu người dùng đã chủ động cắm ghim đỏ trên bản đồ để chọn một vị trí khác
  if (tempPickedPinCoords && tempPickedPinCoords.lat && tempPickedPinCoords.lng) {
    lat = tempPickedPinCoords.lat;
    lng = tempPickedPinCoords.lng;
    addrHint = tempPickedPinCoords.address || '';
  } else if (droppedPinMarker) {
    const pin = droppedPinMarker.getLatLng();
    lat = pin.lat;
    lng = pin.lng;
  } else {
    // Ưu tiên 2: Chuẩn 100% vị trí hiện tại của Chấm Xanh GPS (Đúng ý nghĩa nút "Thêm Vị Trí Hiện Tại")
    const myCoords = getMyLocationCoords();
    lat = myCoords[0];
    lng = myCoords[1];
  }

  if (!lat || !lng) {
    lat = DEFAULT_MAP_CENTER[0];
    lng = DEFAULT_MAP_CENTER[1];
  }

  modalTargetCoords = { lat, lng };

  const coordsText = document.getElementById('addPlaceCoordsText');
  const addrText = document.getElementById('addPlaceAddrText');
  if (coordsText) coordsText.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  if (addrHint) {
    if (addrText) addrText.textContent = addrHint;
  } else {
    if (addrText) addrText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác định tên địa chỉ...';
    reverseGeocodeLocation(lat, lng, (resolved) => {
      const el = document.getElementById('addPlaceAddrText');
      if (el) el.textContent = resolved;
    });
  }

  // Reset form
  const inputName = document.getElementById('inputPlaceName');
  const inputNotes = document.getElementById('inputPlaceNotes');
  if (inputName) inputName.value = '';
  if (inputNotes) inputNotes.value = '';

  const typeOpts = document.querySelectorAll('#placeTypeSelector .type-opt');
  typeOpts.forEach(o => {
    const isGeneral = o.dataset.type === 'general';
    o.classList.toggle('active', isGeneral);
    const radio = o.querySelector('input[type="radio"]');
    if (radio) radio.checked = isGeneral;
  });

  const modal = document.getElementById('modalAddSavedPlace');
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      if (inputName) inputName.focus();
    }, 100);
  }
}

function closeAddSavedPlaceModal() {
  const modal = document.getElementById('modalAddSavedPlace');
  if (modal) modal.style.display = 'none';
  modalTargetCoords = null;
}

function handleConfirmAddSavedPlace(e) {
  if (e) e.preventDefault();

  const inputName = document.getElementById('inputPlaceName');
  const inputNotes = document.getElementById('inputPlaceNotes');
  const activeTypeOpt = document.querySelector('#placeTypeSelector .type-opt.active');

  const name = (inputName && inputName.value.trim()) || '';
  if (!name) {
    if (typeof showToast === 'function') showToast('Vui lòng nhập tên địa điểm!', 'warning');
    else alert('Vui lòng nhập tên địa điểm!');
    if (inputName) inputName.focus();
    return;
  }

  const type = (activeTypeOpt && activeTypeOpt.dataset.type) || 'general';
  const notes = (inputNotes && inputNotes.value.trim()) || '';

  let lat = modalTargetCoords ? modalTargetCoords.lat : null;
  let lng = modalTargetCoords ? modalTargetCoords.lng : null;
  if (!lat || !lng) {
    const cur = getMyLocationCoords();
    lat = cur[0];
    lng = cur[1];
  }

  const addrEl = document.getElementById('addPlaceAddrText');
  const addr = (addrEl && addrEl.textContent && !addrEl.textContent.includes('Đang xác định'))
    ? addrEl.textContent.trim()
    : `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  const newPlace = {
    id: 'place_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: name,
    type: type,
    lat: lat,
    lng: lng,
    address: addr,
    notes: notes,
    createdAt: Date.now()
  };

  savedPlaces.unshift(newPlace);
  saveSavedPlacesList(savedPlaces);

  closeAddSavedPlaceModal();
  clearDroppedPin(); // Dọn sạch ghim tạm đỏ nếu có
  renderSavedPlacesListUI();
  renderAllSavedPlaceMarkers();

  // Focus tới marker trên map
  focusSavedPlaceOnMap(newPlace.id);

  if (typeof showToast === 'function') {
    showToast(`Đã lưu "${newPlace.name}" vào danh sách địa điểm!`, 'success');
  }
}

function deleteSavedPlace(id) {
  const p = savedPlaces.find(x => x.id === id);
  if (!p) return;

  const ok = confirm(`Bạn có chắc muốn xóa địa điểm "${p.name}" khỏi danh sách đã lưu?`);
  if (!ok) return;

  savedPlaces = savedPlaces.filter(x => x.id !== id);
  saveSavedPlacesList(savedPlaces);

  const marker = savedPlaceMarkersMap.get(id);
  if (marker && mainLeafletMap) {
    try { mainLeafletMap.removeLayer(marker); } catch (_) {}
    savedPlaceMarkersMap.delete(id);
  }

  renderSavedPlacesListUI();
  if (typeof showToast === 'function') {
    showToast(`Đã xóa "${p.name}" khỏi danh sách!`, 'info');
  }
}

function focusSavedPlaceOnMap(id) {
  const p = savedPlaces.find(x => x.id === id);
  if (!p || !mainLeafletMap) return;

  mainLeafletMap.setView([p.lat, p.lng], 17);
  const m = savedPlaceMarkersMap.get(id);
  if (m) {
    setTimeout(() => {
      m.openPopup();
    }, 250);
  }
}

function routeToSavedPlace(id) {
  const p = savedPlaces.find(x => x.id === id);
  if (!p) return;

  // Lấy vị trí xuất phát từ chính Chấm Xanh Google Maps của bạn trên bản đồ
  const startCoords = getMyLocationCoords();
  calculateAndDrawRoute(startCoords[0], startCoords[1], p.lat, p.lng, `Tới: ${p.name}`);
}

function routeToCoordinates(destLat, destLng, title = 'Tuyến Đường') {
  const startCoords = getMyLocationCoords();
  calculateAndDrawRoute(startCoords[0], startCoords[1], destLat, destLng, title);
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
      renderAllSavedPlaceMarkers();

      // Nếu có vị trí GPS thời gian thực hoặc GPS gần nhất, ưu tiên hiển thị ngay vị trí đó
      const curCoords = getMyLocationCoords();
      if (curCoords && (curCoords[0] !== DEFAULT_MAP_CENTER[0] || curCoords[1] !== DEFAULT_MAP_CENTER[1])) {
        mainLeafletMap.setView(curCoords, 17);
      } else {
        const homeData = getSavedHomeLocation();
        if (homeData && homeData.lat && homeData.lng) {
          mainLeafletMap.setView([homeData.lat, homeData.lng], 16);
        }
      }
    }

    // Đảm bảo Live GPS Tracking liên tục bám theo
    startLiveGpsTracking(true);
    updateGpsFollowUI(isFollowUserMode);
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

  // Nút tròn nổi GPS chuẩn Google Maps trên bản đồ
  const btnMapFloatingGps = document.getElementById('btnMapFloatingGps');
  if (btnMapFloatingGps) {
    btnMapFloatingGps.addEventListener('click', () => {
      if (!isFollowUserMode) {
        isFollowUserMode = true;
        locateViaGPSOnMainMap(true);
        if (typeof showToast === 'function') {
          showToast('Đã bật chế độ bám theo vị trí khi đi đường!', 'success');
        }
      } else {
        const coords = getMyLocationCoords();
        if (mainLeafletMap) mainLeafletMap.setView(coords, 17, { animate: true });
        updateGpsFollowUI(true);
      }
    });
  }

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
  const btnAddPlace = document.getElementById('btnAddSavedPlace');
  const btnCloseModal = document.getElementById('btnCloseAddPlaceModal');
  const btnCancelModal = document.getElementById('btnCancelAddPlace');
  const formAddPlace = document.getElementById('formAddSavedPlace');
  const modalAdd = document.getElementById('modalAddSavedPlace');

  if (btnAddPlace) btnAddPlace.addEventListener('click', openAddSavedPlaceModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeAddSavedPlaceModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeAddSavedPlaceModal);
  if (formAddPlace) formAddPlace.addEventListener('submit', handleConfirmAddSavedPlace);

  if (modalAdd) {
    modalAdd.addEventListener('click', (e) => {
      if (e.target === modalAdd) closeAddSavedPlaceModal();
    });
  }

  // Bộ chọn loại địa điểm trong Modal
  const typeOpts = document.querySelectorAll('#placeTypeSelector .type-opt');
  typeOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      typeOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const m = document.getElementById('modalAddSavedPlace');
      if (m && m.style.display !== 'none') closeAddSavedPlaceModal();
    }
  });

  const btnHudGps = document.getElementById('btnMainMapGps');
  const btnHudDir = document.getElementById('btnMainMapDirections');
  const btnCloseRoute = document.getElementById('btnCloseRoute');

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
window.setMainMapPickedLocation = setMainMapPickedLocation;
window.updateHomeLocationUI = updateHomeLocationUI;
window.updateMainMapWorkspaceUI = updateMainMapWorkspaceUI;
window.renderMapTab = renderMapTab;
window.navigateToHome = navigateToHome;
window.switchTabToMap = switchTabToMap;
window.switchMainMapLayer = switchMainMapLayer;
window.calculateAndDrawRoute = calculateAndDrawRoute;
window.clearCurrentRoute = clearCurrentRoute;
window.searchAndDisplayNearbyPlaces = searchAndDisplayNearbyPlaces;
window.promptPasteCoordinates = promptPasteCoordinates;
window.openAddSavedPlaceModal = openAddSavedPlaceModal;
window.closeAddSavedPlaceModal = closeAddSavedPlaceModal;
window.handleConfirmAddSavedPlace = handleConfirmAddSavedPlace;
window.deleteSavedPlace = deleteSavedPlace;
window.focusSavedPlaceOnMap = focusSavedPlaceOnMap;
window.routeToSavedPlace = routeToSavedPlace;
window.routeToCoordinates = routeToCoordinates;
window.getMyLocationCoords = getMyLocationCoords;
window.renderSavedPlacesListUI = renderSavedPlacesListUI;
window.renderAllSavedPlaceMarkers = renderAllSavedPlaceMarkers;
window.clearDroppedPin = clearDroppedPin;
window.startLiveGpsTracking = startLiveGpsTracking;
window.updateGpsFollowUI = updateGpsFollowUI;
window.initHomeLocationModule = initHomeLocationModule;
