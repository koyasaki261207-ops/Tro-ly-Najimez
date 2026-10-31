/**
 * js/map-location.js - Quản lý Bản Đồ & Vị Trí Nhà Riêng Najimez
 * Sử dụng Leaflet.js, OpenStreetMap Nominatim và CartoDB Dark Matter
 * Chuẩn Code Modularization cho Dự Án Trợ Lý Ảo Najimez
 */

const HOME_LOC_STORAGE_KEY = 'najimez_home_location';
// Tọa độ mặc định (Trung tâm TP. Hồ Chí Minh nếu chưa có vị trí)
const DEFAULT_MAP_CENTER = [10.762622, 106.660172];
const DEFAULT_MAP_ZOOM = 14;

let homeLeafletMap = null;
let homeMarkerInstance = null;
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
    window.dispatchEvent(new CustomEvent('najimez-home-location-updated', { detail: locData }));

    // Kích hoạt đồng bộ đám mây Firebase nếu có module
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
  } else {
    if (iconAura) iconAura.classList.remove('configured');
    if (icon) icon.className = 'fa-solid fa-house-chimney';
    if (statusBadge) {
      statusBadge.textContent = 'Chưa thiết lập';
      statusBadge.classList.remove('active');
    }
    if (addressEl) {
      addressEl.textContent = 'Nhấn "Đánh Dấu Vị Trí" để ghim nhà trên bản đồ mini hoặc định vị GPS tự động.';
    }
    if (coordsRow) coordsRow.style.display = 'none';
    if (btnDirections) btnDirections.disabled = true;
    if (btnClear) btnClear.style.display = 'none';
  }
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
    openHomeMapModal();
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${homeData.lat},${homeData.lng}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Mở Modal Bản Đồ Đánh Dấu
 */
function openHomeMapModal() {
  const modal = document.getElementById('homeMapModal');
  if (!modal) return;
  modal.classList.add('active');

  // Khởi tạo bản đồ nếu chưa có
  setTimeout(() => {
    initLeafletHomeMap();
    if (homeLeafletMap) {
      homeLeafletMap.invalidateSize();
      const homeData = getSavedHomeLocation();
      if (homeData && homeData.lat && homeData.lng) {
        setPickedMarkerLocation(homeData.lat, homeData.lng, homeData.address, true, false);
      } else {
        // Tự động thử lấy GPS nếu chưa từng lưu
        locateUserViaGPS(false);
      }
    }
  }, 200);
}

/**
 * Đóng Modal Bản Đồ
 */
function closeHomeMapModal() {
  const modal = document.getElementById('homeMapModal');
  if (modal) modal.classList.remove('active');
  hideSearchResults();
}

/**
 * Khởi tạo Leaflet Map (CartoDB Dark Matter tiles)
 */
function initLeafletHomeMap() {
  if (homeLeafletMap || typeof L === 'undefined') return;

  const mapContainer = document.getElementById('homeLeafletMap');
  if (!mapContainer) return;

  // Tạo map instance
  homeLeafletMap = L.map('homeLeafletMap', {
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    zoomControl: true
  });

  // Nạp Dark Matter tiles của CartoDB (Miễn phí, chuẩn dark cyberpunk)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(homeLeafletMap);

  // Tạo Custom Neon Home Pin Icon
  const homeDivIcon = L.divIcon({
    className: 'custom-neon-pin-wrapper',
    html: '<div class="neon-home-marker" title="Kéo thả ghim để chọn vị trí"><i class="fa-solid fa-house-chimney"></i></div>',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  // Tạo Marker có thể kéo thả
  homeMarkerInstance = L.marker(DEFAULT_MAP_CENTER, {
    icon: homeDivIcon,
    draggable: true
  }).addTo(homeLeafletMap);

  // Sự kiện kéo thả ghim marker
  homeMarkerInstance.on('dragend', (e) => {
    const latlng = e.target.getLatLng();
    setPickedMarkerLocation(latlng.lat, latlng.lng, null, false, true);
  });

  // Sự kiện nhấp chuột trực tiếp lên bản đồ
  homeLeafletMap.on('click', (e) => {
    setPickedMarkerLocation(e.latlng.lat, e.latlng.lng, null, false, true);
  });
}

/**
 * Đặt vị trí ghim và cập nhật nhãn địa chỉ
 */
function setPickedMarkerLocation(lat, lng, addressText = null, shouldPan = true, shouldReverseGeocode = true) {
  currentPickedLat = lat;
  currentPickedLng = lng;

  if (homeMarkerInstance) {
    homeMarkerInstance.setLatLng([lat, lng]);
  }
  if (homeLeafletMap && shouldPan) {
    homeLeafletMap.setView([lat, lng], Math.max(homeLeafletMap.getZoom(), 15));
  }

  const coordsEl = document.getElementById('homeMapPickedCoords');
  if (coordsEl) coordsEl.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const addressEl = document.getElementById('homeMapPickedAddress');
  if (addressText) {
    currentPickedAddress = addressText;
    if (addressEl) addressEl.textContent = addressText;
  } else if (shouldReverseGeocode) {
    if (addressEl) addressEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác định tên địa chỉ...';
    reverseGeocodeLocation(lat, lng);
  }
}

/**
 * Tra cứu địa chỉ từ tọa độ (Reverse Geocoding qua OpenStreetMap Nominatim)
 */
function reverseGeocodeLocation(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  
  fetch(url, { headers: { 'Accept-Language': 'vi,en' } })
    .then(res => res.json())
    .then(data => {
      const addressEl = document.getElementById('homeMapPickedAddress');
      if (data && data.display_name) {
        currentPickedAddress = data.display_name;
        if (addressEl) addressEl.textContent = data.display_name;
      } else {
        currentPickedAddress = `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (addressEl) addressEl.textContent = currentPickedAddress;
      }
    })
    .catch(err => {
      console.warn('[MapLocation] Lỗi reverse geocode:', err);
      const addressEl = document.getElementById('homeMapPickedAddress');
      currentPickedAddress = `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (addressEl) addressEl.textContent = currentPickedAddress;
    });
}

/**
 * Tìm kiếm địa chỉ qua OpenStreetMap Nominatim
 */
function searchAddressViaNominatim(query) {
  if (!query || query.trim().length < 2) return;
  const cleanQ = query.trim();
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQ)}&countrycodes=vn&limit=5&addressdetails=1`;

  const resultsDropdown = document.getElementById('homeMapSearchResults');
  if (resultsDropdown) {
    resultsDropdown.innerHTML = '<div class="search-result-item" style="color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tìm kiếm...</div>';
    resultsDropdown.style.display = 'block';
  }

  fetch(url, { headers: { 'Accept-Language': 'vi,en' } })
    .then(res => res.json())
    .then(list => {
      if (!resultsDropdown) return;
      if (!list || list.length === 0) {
        resultsDropdown.innerHTML = '<div class="search-result-item" style="color:#f87171;">Không tìm thấy địa điểm phù hợp. Thử tìm tên đường/quận rộng hơn.</div>';
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
          setPickedMarkerLocation(lat, lng, item.display_name, true, false);
          hideSearchResults();
        });
        resultsDropdown.appendChild(itemEl);
      });
    })
    .catch(err => {
      console.warn('[MapLocation] Lỗi tìm kiếm địa chỉ:', err);
      if (resultsDropdown) {
        resultsDropdown.innerHTML = '<div class="search-result-item" style="color:#f87171;">Lỗi kết nối tra cứu địa chỉ.</div>';
      }
    });
}

function hideSearchResults() {
  const dropdown = document.getElementById('homeMapSearchResults');
  if (dropdown) dropdown.style.display = 'none';
}

/**
 * Định vị GPS qua trình duyệt
 */
function locateUserViaGPS(showToastNotice = true) {
  if (!navigator.geolocation) {
    if (showToastNotice) alert('Trình duyệt của bạn không hỗ trợ định vị GPS!');
    return;
  }

  const overlay = document.getElementById('homeMapLoadingOverlay');
  const overlayText = document.getElementById('homeMapLoadingText');
  if (overlay) {
    if (overlayText) overlayText.textContent = 'Đang bắt tín hiệu GPS...';
    overlay.style.display = 'flex';
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (overlay) overlay.style.display = 'none';
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setPickedMarkerLocation(lat, lng, null, true, true);
      if (showToastNotice && typeof showToast === 'function') {
        showToast('Đã bắt vị trí GPS thành công!', 'success');
      }
    },
    (err) => {
      if (overlay) overlay.style.display = 'none';
      console.warn('[MapLocation] Lỗi bắt GPS:', err.message);
      if (showToastNotice) {
        alert('Không thể lấy vị trí GPS. Hãy kiểm tra quyền truy cập vị trí của trình duyệt!');
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

/**
 * Bắt GPS nhanh trực tiếp từ thẻ Dashboard mà không cần mở Modal
 */
function handleQuickGpsHome() {
  if (!navigator.geolocation) {
    alert('Trình duyệt của bạn không hỗ trợ định vị GPS!');
    return;
  }

  const confirmMsg = confirm('Bạn có muốn lấy vị trí GPS hiện tại để lưu làm Nhà Riêng của bạn không?');
  if (!confirmMsg) return;

  if (typeof showToast === 'function') {
    showToast('Đang kết nối GPS thiết bị...', 'info');
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      
      // Gọi geocoding lấy địa chỉ
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`, { headers: { 'Accept-Language': 'vi,en' } })
        .then(res => res.json())
        .then(data => {
          const addr = (data && data.display_name) || `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          saveHomeLocationData({
            lat: lat,
            lng: lng,
            address: addr,
            updatedAt: Date.now()
          });
          if (typeof showToast === 'function') {
            showToast('Đã lưu vị trí Nhà Riêng thành công qua GPS!', 'success');
          }
        })
        .catch(() => {
          saveHomeLocationData({
            lat: lat,
            lng: lng,
            address: `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            updatedAt: Date.now()
          });
          if (typeof showToast === 'function') {
            showToast('Đã lưu vị trí Nhà Riêng thành công!', 'success');
          }
        });
    },
    (err) => {
      console.warn('[MapLocation] Quick GPS lỗi:', err.message);
      alert('Không thể lấy GPS. Vui lòng cấp quyền vị trí cho trình duyệt!');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/**
 * Xóa vị trí nhà riêng đã lưu
 */
function handleClearHomeLocation() {
  const confirmDel = confirm('Bạn có chắc chắn muốn xóa vị trí Nhà Riêng đã lưu không?');
  if (!confirmDel) return;

  localStorage.removeItem(HOME_LOC_STORAGE_KEY);
  updateHomeLocationUI();
  if (typeof showToast === 'function') {
    showToast('Đã xóa vị trí Nhà Riêng.', 'info');
  }
}

/**
 * Lưu vị trí từ Modal
 */
function handleConfirmSaveModal() {
  if (!currentPickedLat || !currentPickedLng) {
    alert('Vui lòng chọn vị trí trên bản đồ trước khi lưu!');
    return;
  }

  const addr = currentPickedAddress || `Tọa độ: ${currentPickedLat.toFixed(5)}, ${currentPickedLng.toFixed(5)}`;
  const ok = saveHomeLocationData({
    lat: currentPickedLat,
    lng: currentPickedLng,
    address: addr,
    updatedAt: Date.now()
  });

  if (ok) {
    if (typeof showToast === 'function') {
      showToast('Đã lưu vị trí Nhà Riêng thành công!', 'success');
    }
    closeHomeMapModal();
  } else {
    alert('Có lỗi khi lưu vị trí. Vui lòng thử lại!');
  }
}

/**
 * Khởi tạo toàn bộ module Vị Trí & Bản Đồ
 */
function initHomeLocationModule() {
  updateHomeLocationUI();

  // Nút trên Thẻ Hộp Dụng Cụ
  const btnOpenModal = document.getElementById('btnOpenHomeMapModal');
  const btnDirections = document.getElementById('btnDirectionsHome');
  const btnQuickGps = document.getElementById('btnQuickGpsHome');
  const btnClear = document.getElementById('btnClearHomeLoc');
  const btnRefresh = document.getElementById('btnQuickRefreshHome');

  if (btnOpenModal) btnOpenModal.addEventListener('click', openHomeMapModal);
  if (btnDirections) btnDirections.addEventListener('click', navigateToHome);
  if (btnQuickGps) btnQuickGps.addEventListener('click', handleQuickGpsHome);
  if (btnClear) btnClear.addEventListener('click', handleClearHomeLocation);
  if (btnRefresh) btnRefresh.addEventListener('click', updateHomeLocationUI);

  // Nút trên Modal
  const btnCloseModal = document.getElementById('btnCloseHomeMapModal');
  const btnCancelModal = document.getElementById('btnCancelHomeMap');
  const btnSaveModal = document.getElementById('btnSaveHomeLocation');
  const btnGpsModal = document.getElementById('btnMapGpsLocate');
  const btnSearch = document.getElementById('btnSearchAddress');
  const searchInput = document.getElementById('homeMapSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearchInput');

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeHomeMapModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeHomeMapModal);
  if (btnSaveModal) btnSaveModal.addEventListener('click', handleConfirmSaveModal);
  if (btnGpsModal) btnGpsModal.addEventListener('click', () => locateUserViaGPS(true));

  if (btnSearch && searchInput) {
    btnSearch.addEventListener('click', () => searchAddressViaNominatim(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchAddressViaNominatim(searchInput.value);
      }
    });

    searchInput.addEventListener('input', () => {
      if (btnClearSearch) {
        btnClearSearch.style.display = searchInput.value ? 'block' : 'none';
      }
      clearTimeout(searchDebounceTimeout);
      if (searchInput.value.trim().length >= 3) {
        searchDebounceTimeout = setTimeout(() => {
          searchAddressViaNominatim(searchInput.value);
        }, 500);
      } else {
        hideSearchResults();
      }
    });
  }

  if (btnClearSearch && searchInput) {
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      btnClearSearch.style.display = 'none';
      hideSearchResults();
    });
  }

  // Đóng modal khi click ra ngoài backdrop
  const modalBackdrop = document.getElementById('homeMapModal');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeHomeMapModal();
    });
  }
}

// Xuất các hàm ra global scope để các module khác (Copilot, Firebase) có thể gọi
window.getSavedHomeLocation = getSavedHomeLocation;
window.saveHomeLocationData = saveHomeLocationData;
window.updateHomeLocationUI = updateHomeLocationUI;
window.openHomeMapModal = openHomeMapModal;
window.navigateToHome = navigateToHome;
window.initHomeLocationModule = initHomeLocationModule;
