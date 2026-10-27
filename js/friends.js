/**
 * js/friends.js - Module Dữ Liệu & Đồng Bộ Thời Gian Thực Bạn Bè (Najimez Social Connect)
 * Tự động đồng bộ lời mời kết bạn, danh sách bạn bè và mã định danh qua Firebase Firestore.
 * Tuân thủ quy chuẩn Code Modularization (< 500 dòng).
 */

const FRIENDS_CODE_STORAGE_KEY = 'najimez_my_friend_code';

let friendsUnsubscribeRequests = null;
let friendsUnsubscribeList = null;
let friendsUnsubscribeNotes = null;
let currentMyFriendCode = null;
let activeFriendRequests = [];
let activeFriendsList = [];

/**
 * Lấy đối tượng Firestore instance từ Firebase SDK
 */
function getFirestoreDb() {
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      return firebase.firestore();
    } catch (e) {
      console.warn('[Friends] Chưa thể khởi tạo Firestore:', e);
    }
  }
  return null;
}

/**
 * Lấy thông tin tài khoản người dùng hiện tại
 */
function getActiveSocialUser() {
  const user = window.currentUser || (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);
  if (!user || user.isAnonymous) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || 'Chủ nhân Najimez',
    email: user.email || '',
    photoURL: user.photoURL || 'assets/najimez.jpg'
  };
}

/**
 * Sinh mã ngẫu nhiên cho Najimez ID (VD: NJ-7K9A2B)
 */
function generateRandomFriendCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'NJ-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Lấy hoặc khởi tạo Mã Najimez ID cho người dùng trên Firestore
 */
async function getOrInitMyFriendCode() {
  const user = getActiveSocialUser();
  if (!user) {
    return localStorage.getItem(FRIENDS_CODE_STORAGE_KEY) || 'NJ-GUEST';
  }

  // 1. Kiểm tra cache cục bộ
  let cachedCode = localStorage.getItem(`${FRIENDS_CODE_STORAGE_KEY}_${user.uid}`);
  if (cachedCode) {
    currentMyFriendCode = cachedCode;
  }

  const db = getFirestoreDb();
  if (!db) return currentMyFriendCode || 'NJ-OFFLINE';

  try {
    const userDocRef = db.collection('users').doc(user.uid);
    const docSnap = await userDocRef.get();

    if (docSnap.exists && docSnap.data().friendCode) {
      currentMyFriendCode = docSnap.data().friendCode;
      localStorage.setItem(`${FRIENDS_CODE_STORAGE_KEY}_${user.uid}`, currentMyFriendCode);
      return currentMyFriendCode;
    }

    // Nếu chưa có, tạo mã mới và lưu lên Firestore
    let newCode = generateRandomFriendCode();
    // Đảm bảo không trùng mã trong friend_codes
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      attempts++;
      const codeSnap = await db.collection('friend_codes').doc(newCode).get();
      if (!codeSnap.exists) {
        isUnique = true;
      } else {
        newCode = generateRandomFriendCode();
      }
    }

    const userData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      friendCode: newCode,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Lưu vào users và bảng tra cứu nhanh friend_codes
    const batch = db.batch();
    batch.set(userDocRef, userData, { merge: true });
    batch.set(db.collection('friend_codes').doc(newCode), {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    });

    await batch.commit();
    currentMyFriendCode = newCode;
    localStorage.setItem(`${FRIENDS_CODE_STORAGE_KEY}_${user.uid}`, newCode);
    console.log('[Friends] Đã tạo mã Najimez ID mới:', newCode);
    return newCode;
  } catch (err) {
    console.error('[Friends] Lỗi khởi tạo Friend Code:', err);
    return currentMyFriendCode || 'NJ-TEMP';
  }
}

/**
 * Lắng nghe lời mời kết bạn thời gian thực từ Firestore
 */
function subscribeToFriendRequests(onUpdateCallback) {
  if (typeof friendsUnsubscribeRequests === 'function') {
    friendsUnsubscribeRequests();
    friendsUnsubscribeRequests = null;
  }

  const user = getActiveSocialUser();
  const db = getFirestoreDb();
  if (!user || !db) return;

  try {
    friendsUnsubscribeRequests = db.collection('friend_requests')
      .where('toUid', '==', user.uid)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        activeFriendRequests = requests;
        updateFriendRequestsBadge(requests.length);
        if (typeof onUpdateCallback === 'function') {
          onUpdateCallback(requests);
        }
      }, (err) => {
        console.warn('[Friends] Lỗi lắng nghe lời mời kết bạn:', err);
      });
  } catch (err) {
    console.error('[Friends] Lỗi thiết lập listener lời mời:', err);
  }
}

/**
 * Lắng nghe danh sách bạn bè thời gian thực từ Firestore
 */
function subscribeToFriendsList(onUpdateCallback) {
  if (typeof friendsUnsubscribeList === 'function') {
    friendsUnsubscribeList();
    friendsUnsubscribeList = null;
  }

  const user = getActiveSocialUser();
  const db = getFirestoreDb();
  if (!user || !db) return;

  try {
    friendsUnsubscribeList = db.collection('friendships')
      .where('users', 'array-contains', user.uid)
      .onSnapshot((snapshot) => {
        const friends = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Lấy thông tin của người bạn (không phải chính mình)
          let friendProfile = null;
          if (data.user1 && data.user1.uid !== user.uid) {
            friendProfile = data.user1;
          } else if (data.user2 && data.user2.uid !== user.uid) {
            friendProfile = data.user2;
          } else if (Array.isArray(data.profiles)) {
            friendProfile = data.profiles.find(p => p.uid !== user.uid);
          }

          if (friendProfile) {
            friends.push({
              friendshipId: doc.id,
              ...friendProfile,
              createdAt: data.createdAt
            });
          }
        });

        activeFriendsList = friends;
        if (typeof onUpdateCallback === 'function') {
          onUpdateCallback(friends);
        }
      }, (err) => {
        console.warn('[Friends] Lỗi lắng nghe danh sách bạn bè:', err);
      });
  } catch (err) {
    console.error('[Friends] Lỗi thiết lập listener bạn bè:', err);
  }
}

/**
 * Gửi lời mời kết bạn bằng Mã ID hoặc Email Google
 */
async function sendFriendRequestToUser(targetQuery) {
  const user = getActiveSocialUser();
  if (!user) {
    return { success: false, message: 'Bạn cần đăng nhập Google để kết nối bạn bè nhé!' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return { success: false, message: 'Hệ thống kết nối chưa sẵn sàng. Vui lòng thử lại sau!' };
  }

  const queryClean = (targetQuery || '').trim();
  if (!queryClean) {
    return { success: false, message: 'Vui lòng nhập Mã Najimez ID hoặc Email bạn bè!' };
  }

  try {
    let targetUser = null;

    // 1. Tìm theo Mã Friend Code (VD: NJ-7K9A2B)
    const upperQuery = queryClean.toUpperCase();
    if (upperQuery.startsWith('NJ-') || !queryClean.includes('@')) {
      const codeKey = upperQuery.startsWith('NJ-') ? upperQuery : `NJ-${upperQuery}`;
      const codeDoc = await db.collection('friend_codes').doc(codeKey).get();
      if (codeDoc.exists) {
        targetUser = codeDoc.data();
      }
    }

    // 2. Nếu chưa thấy và có dạng email, tìm theo email
    if (!targetUser && queryClean.includes('@')) {
      const emailSnap = await db.collection('users')
        .where('email', '==', queryClean.toLowerCase())
        .limit(1)
        .get();
      if (!emailSnap.empty) {
        targetUser = emailSnap.docs[0].data();
      }
    }

    if (!targetUser) {
      return { success: false, message: `Không tìm thấy người dùng nào với mã hoặc email "${queryClean}"!` };
    }

    if (targetUser.uid === user.uid) {
      return { success: false, message: 'Bạn không thể tự gửi lời mời kết bạn cho chính mình!' };
    }

    // 3. Kiểm tra xem đã là bạn bè chưa
    const canonicalId = [user.uid, targetUser.uid].sort().join('_');
    const friendDoc = await db.collection('friendships').doc(canonicalId).get();
    if (friendDoc.exists) {
      return { success: false, message: `Bạn và ${targetUser.displayName} đã là bạn bè rồi nè!` };
    }

    // 4. Kiểm tra xem đã có lời mời chờ duyệt trước đó chưa
    const existingReq = await db.collection('friend_requests')
      .where('fromUid', '==', user.uid)
      .where('toUid', '==', targetUser.uid)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingReq.empty) {
      return { success: false, message: 'Bạn đã gửi lời mời cho người này rồi, hãy chờ đối phương chấp nhận nhé!' };
    }

    // 5. Gửi lời mời mới
    const myCode = currentMyFriendCode || localStorage.getItem(`${FRIENDS_CODE_STORAGE_KEY}_${user.uid}`) || '';
    await db.collection('friend_requests').add({
      fromUid: user.uid,
      fromName: user.displayName,
      fromEmail: user.email,
      fromPhoto: user.photoURL,
      fromFriendCode: myCode,
      toUid: targetUser.uid,
      toName: targetUser.displayName,
      toEmail: targetUser.email || '',
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: `Đã gửi lời mời kết bạn đến "${targetUser.displayName}" thành công!`
    };
  } catch (err) {
    console.error('[Friends] Lỗi gửi lời mời:', err);
    return { success: false, message: 'Lỗi gửi lời mời: ' + (err.message || 'Không xác định') };
  }
}

/**
 * Chấp nhận lời mời kết bạn
 */
async function acceptFriendRequestItem(request) {
  const user = getActiveSocialUser();
  const db = getFirestoreDb();
  if (!user || !db || !request) return false;

  try {
    const canonicalId = [user.uid, request.fromUid].sort().join('_');
    const myCode = currentMyFriendCode || localStorage.getItem(`${FRIENDS_CODE_STORAGE_KEY}_${user.uid}`) || '';

    const batch = db.batch();

    // 1. Cập nhật trạng thái lời mời thành accepted
    const reqRef = db.collection('friend_requests').doc(request.id);
    batch.update(reqRef, {
      status: 'accepted',
      acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 2. Tạo bản ghi quan hệ bạn bè (Friendship)
    const friendshipRef = db.collection('friendships').doc(canonicalId);
    batch.set(friendshipRef, {
      users: [user.uid, request.fromUid],
      user1: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        friendCode: myCode
      },
      user2: {
        uid: request.fromUid,
        displayName: request.fromName,
        email: request.fromEmail || '',
        photoURL: request.fromPhoto || 'assets/najimez.jpg',
        friendCode: request.fromFriendCode || ''
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Friends] Lỗi chấp nhận lời mời:', err);
    return false;
  }
}

/**
 * Từ chối hoặc hủy lời mời kết bạn
 */
async function rejectFriendRequestItem(requestId) {
  const db = getFirestoreDb();
  if (!db || !requestId) return false;

  try {
    await db.collection('friend_requests').doc(requestId).update({
      status: 'rejected',
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('[Friends] Lỗi từ chối lời mời:', err);
    return false;
  }
}

/**
 * Hủy kết bạn (Xóa quan hệ bạn bè)
 */
async function removeFriendshipItem(friendshipId) {
  const db = getFirestoreDb();
  if (!db || !friendshipId) return false;

  try {
    await db.collection('friendships').doc(friendshipId).delete();
    return true;
  } catch (err) {
    console.error('[Friends] Lỗi xóa bạn bè:', err);
    return false;
  }
}

/**
 * Cập nhật số đếm thông báo lời mời trên Sidebar
 */
function updateFriendRequestsBadge(count) {
  const badge = document.getElementById('friendRequestsBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Lắng nghe khi có thay đổi tài khoản Google
 */
function initFriendsForUser(user) {
  if (user && !user.isAnonymous) {
    getOrInitMyFriendCode().then(() => {
      if (typeof renderFriendsTab === 'function') {
        renderFriendsTab();
      }
    });

    subscribeToFriendRequests(() => {
      if (typeof renderFriendsTab === 'function') renderFriendsTab();
    });

    subscribeToFriendsList(() => {
      if (typeof renderFriendsTab === 'function') renderFriendsTab();
    });
  } else {
    currentMyFriendCode = null;
    activeFriendRequests = [];
    activeFriendsList = [];
    updateFriendRequestsBadge(0);
    if (typeof renderFriendsTab === 'function') {
      renderFriendsTab();
    }
  }
}

// Xuất các biến và hàm ra toàn cục
window.getActiveSocialUser = getActiveSocialUser;
window.getOrInitMyFriendCode = getOrInitMyFriendCode;
window.sendFriendRequestToUser = sendFriendRequestToUser;
window.acceptFriendRequestItem = acceptFriendRequestItem;
window.rejectFriendRequestItem = rejectFriendRequestItem;
window.removeFriendshipItem = removeFriendshipItem;
window.initFriendsForUser = initFriendsForUser;
window.getActiveFriendRequests = () => activeFriendRequests;
window.getActiveFriendsList = () => activeFriendsList;
