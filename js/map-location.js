/**
 * js/map-location.js - Quản lý Trung Tâm Bản Đồ & Vị Trí Nhà Riêng Najimez
 * Sử dụng Google Maps Tile Layer, Leaflet.js và BigDataCloud / Nominatim Geocoding
 * Chuẩn Code Modularization cho Dự Án Trợ Lý Ảo Najimez
 */

const HOME_LOC_STORAGE_KEY = 'najimez_home_location';
const DEFAULT_MAP_CENTER = [10.762622, 106.660172]; // TP. Hồ Chí Minh
const DEFAULT_MAP_ZOOM = 15;

// Cấu hình các lớp bản đồ trực tuyến (Google Maps chính thức qua Tile Server)
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

    // Cập nhật inline mini map
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
 * Mở Google Maps chỉ đường về nhà
 */
function navigateToHome() {
  const homeData = getSavedHomeLocation();
  if (!homeData || !homeData.lat || !homeData.lng) {
    if (typeof showToast === 'function') {
      showToast('Vui lòng đánh dấu vị trí nhà trước khi mở chỉ đường!', 'warning');
    } else {
      alert('Vui lòng đánh dấu vị trí nhà trước khi mở chỉ đường!');
    }
    switchTabToMap();
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${homeData.lat},${homeData.lng}`;
  window.open(url, '_blank', 'noopener,noreferrer');
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

  // Nạp lớp Google Maps tiếng Việt mặc định
  const cfg = MAP_LAYERS[currentLayerKey] || MAP_LAYERS['google-street'];
  currentMainTileLayer = L.tileLayer(cfg.url, cfg.options).addTo(mainLeafletMap);

  // Custom Neon Pin
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

  // Sự kiện kéo thả ghim
  mainHomeMarker.on('dragend', (e) => {
    const latlng = e.target.getLatLng();
    setMainMapPickedLocation(latlng.lat, latlng.lng, null, false, true);
  });

  // Sự kiện click trực tiếp lên bản đồ
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

  // Nạp Google Maps cho mini map
  L.tileLayer(MAP_LAYERS['google-street'].url, MAP_LAYERS['google-street'].options).addTo(inlineMiniMap);

  const miniDivIcon = L.divIcon({
    className: 'custom-neon-pin-wrapper',
    html: '<div class="neon-home-marker" style="width:34px;height:34px;font-size:15px;"><i class="fa-solid fa-house-chimney"></i></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  inlineHomeMarker = L.marker(initialCenter, { icon: miniDivIcon }).addTo(inlineMiniMap);

  // Click vào mini map sẽ chuyển sang Trung Tâm Bản Đồ đầy đủ
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
 * Tra cứu địa chỉ tiếng Việt từ tọa độ GPS (BigDataCloud + OpenStreetMap Nominatim dự phòng)
 */
function reverseGeocodeLocation(lat, lng, callback) {
  // 1. Thử BigDataCloud API (siêu nhanh, tên địa danh Việt Nam rất chuẩn xác, không bị chặn)
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
      // 2. Dự phòng OpenStreetMap Nominatim
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
 * Tìm kiếm địa chỉ qua Nominatim trên Main Map
 */
function searchMainMapAddress(query) {
  if (!query || query.trim().length < 2) return;
  const cleanQ = query.trim();
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQ)}&countrycodes=vn&limit=5&addressdetails=1`;

  const resultsDropdown = document.getElementById('mainMapSearchResults');
  if (resultsDropdown) {
    resultsDropdown.innerHTML = '<div class="search-result-item" style="color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tìm kiếm...</div>';
    resultsDropdown.style.display = 'block';
  }

  fetch(url, { headers: { 'Accept-Language': 'vi,en' } })
    .then(res => res.json())
    .then(list => {
      if (!resultsDropdown) return;
      if (!list || list.length === 0) {
        resultsDropdown.innerHTML = '<div class="search-result-item" style="color:#f87171;">Không tìm thấy địa điểm. Thử tìm tên đường/quận rộng hơn.</div>';
        return;
      }

      resultsDropdown.innerHTML = '';
      list.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'search-result-item';
        itemEl.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#38bdf8; margin-right:6px;"></i> ${item.display_name}`;
        itemEl.addEventListener('click', () => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          setMainMapPickedLocation(lat, lng, item.display_name, true, false);
          resultsDropdown.style.display = 'none';
        });
        resultsDropdown.appendChild(itemEl);
      });
    })
    .catch(err => {
      console.warn('[MapLocation] Lỗi tìm kiếm:', err);
      if (resultsDropdown) {
        resultsDropdown.innerHTML = '<div class="search-result-item" style="color:#f87171;">Lỗi kết nối tra cứu địa chỉ.</div>';
      }
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
      setMainMapPickedLocation(lat, lng, null, true, true);
      if (typeof showToast === 'function') {
        showToast('Đã bắt vị trí GPS thành công!', 'success');
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
    showToast('Đã lưu vị trí Nhà Riêng thành công!', 'success');
  }
}

/**
 * Xóa vị trí nhà riêng đã lưu
 */
function handleClearHomeLocation() {
  const confirmDel = confirm('Bạn có chắc chắn muốn xóa vị trí Nhà Riêng đã lưu không?');
  if (!confirmDel) return;

  localStorage.removeItem(HOME_LOC_STORAGE_KEY);
  updateHomeLocationUI();
  updateMainMapWorkspaceUI();
  if (typeof showToast === 'function') {
    showToast('Đã xóa vị trí Nhà Riêng.', 'info');
  }
}

/**
 * Mở tìm kiếm địa điểm xung quanh qua Google Maps
 */
function handleSearchNearbyPlace(query) {
  const homeData = getSavedHomeLocation();
  const lat = (homeData && homeData.lat) || currentPickedLat || DEFAULT_MAP_CENTER[0];
  const lng = (homeData && homeData.lng) || currentPickedLng || DEFAULT_MAP_CENTER[1];

  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`;
  window.open(url, '_blank', 'noopener,noreferrer');
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

  if (btnSaveMain) btnSaveMain.addEventListener('click', handleSaveFromMainMap);
  if (btnNavMain) btnNavMain.addEventListener('click', navigateToHome);
  if (btnGpsMain) btnGpsMain.addEventListener('click', locateViaGPSOnMainMap);
  if (btnClearMain) btnClearMain.addEventListener('click', handleClearHomeLocation);
  if (btnHudGps) btnHudGps.addEventListener('click', locateViaGPSOnMainMap);
  if (btnHudDir) btnHudDir.addEventListener('click', navigateToHome);

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

  // Chips tìm địa điểm xung quanh
  const placeChips = document.querySelectorAll('.map-place-chip');
  placeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.query;
      if (q) handleSearchNearbyPlace(q);
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
window.initHomeLocationModule = initHomeLocationModule;
