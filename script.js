// ==========================================
// 1. Firebase Configuration & Initialization
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDE21Vj9V44yjc350Ch9ch2R_5j8VP9ODo",
  authDomain: "himmah-task-manger.firebaseapp.com",
  projectId: "himmah-task-manger",
  storageBucket: "himmah-task-manger.firebasestorage.app",
  messagingSenderId: "747080974508",
  appId: "1:747080974508:web:05d4cb8b5ae16fec489f09"
};

// Initialize Firebase App & Services
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Application Global State
let currentUser = null;
let currentLang = localStorage.getItem('himmah_lang') || 'EN';
let currentTheme = localStorage.getItem('himmah_theme') || 'light';

let userData = {
  name: 'User',
  email: '',
  xp: 0,
  level: 1,
  streak: 1,
  items: [] // Stores tasks, ideas, and events
};

let editingItemId = null;
let isSignUpMode = false;
let unsubscribeUserListener = null;

// i18n Translations Dictionary
const i18nTranslations = {
  EN: {
    auth_tagline: "Boost your productivity with gamified tasks.",
    login_title: "Welcome Back!",
    signup_title: "Create Account",
    login_btn: "Sign In",
    signup_btn: "Sign Up",
    logout_btn: "Sign Out",
    no_account: "Don't have an account?",
    has_account: "Already have an account?",
    signup_link: "Sign Up",
    login_link: "Sign In",
    menu_dash: "Dashboard",
    menu_brain: "Brain Dump",
    menu_tasks: "Quests",
    menu_stats: "Analytics",
    search_ph: "Search tasks, notes...",
    days: "Days",
    pts: "XP",
    hi_text: "Hi",
    welcome_sub: "Ready to crush your daily goals and maintain your streak today?",
    quick_dump_btn: "+ Quick Brain Dump",
    brain_dump_title: "Brain Dump",
    quick_capture: "Quick Capture",
    input_placeholder: "What's on your mind right now?",
    btn_task: "Task",
    btn_idea: "Idea",
    btn_event: "Event",
    progression: "Progression",
    level: "Lvl",
    next_level: "Next Level Progress",
    tasks_done: "Completed",
    completion_rate: "Success Rate",
    tasks_title: "Today's Quests",
    brain_desc: "Clear your head. Dump ideas, thoughts, and tasks freely.",
    ideas_heading: "Ideas",
    events_heading: "Events",
    quests_heading: "Quests & Tasks",
    quests_desc: "Track and complete your objectives to earn XP.",
    analytics_heading: "Analytics & Performance",
    analytics_desc: "Track your productivity growth and consistency over time.",
    weekly_prod: "Weekly Output",
    milestones: "Milestones"
  },
  AR: {
    auth_tagline: "زِد إنتاجيتك مع تنظيم المهام بأسلوب ممتع.",
    login_title: "مرحباً بعودتك!",
    signup_title: "إنشاء حساب جديد",
    login_btn: "تسجيل الدخول",
    signup_btn: "إنشاء حساب",
    logout_btn: "تسجيل الخروج",
    no_account: "ليس لديك حساب؟",
    has_account: "لديك حساب بالفعل؟",
    signup_link: "سجّل الآن",
    login_link: "تسجيل الدخول",
    menu_dash: "الرئيسية",
    menu_brain: "تفريغ الذهن",
    menu_tasks: "المهام والأنشطة",
    menu_stats: "الإحصائيات",
    search_ph: "ابحث عن مهام، أفكار...",
    days: "أيام",
    pts: "نقطة",
    hi_text: "أهلاً",
    welcome_sub: "هل أنت مستعد لتحقيق أهدافك اليوم والحفاظ على إنجازك؟",
    quick_dump_btn: "+ تفريغ سريع",
    brain_dump_title: "تفريغ الذهن",
    quick_capture: "تدوين سريع",
    input_placeholder: "ما الذي يدور في ذهنك الآن؟",
    btn_task: "مهمة",
    btn_idea: "فكرة",
    btn_event: "حدث",
    progression: "مستوى التقدم",
    level: "مستوى",
    next_level: "التقدم للمستوى التالي",
    tasks_done: "المكتملة",
    completion_rate: "نسبة الإنجاز",
    tasks_title: "مهام اليوم",
    brain_desc: "صفِّ ذهنك. دوّن أفكارك ومهامك وأحداثك بكل حرية.",
    ideas_heading: "الأفكار",
    events_heading: "الأحداث والفعاليات",
    quests_heading: "المهام والأنشطة",
    quests_desc: "تتبع أهدافك وأنجزها لكسب نقاط الخبرة XP.",
    analytics_heading: "التحليلات والأداء",
    analytics_desc: "تتبع نمو إنتاجيتك واستمراريتك بمرور الوقت.",
    weekly_prod: "الإنجاز الأسبوعي",
    milestones: "الإنجازات"
  }
};

// Document Init
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupLanguage();
  setupEventListeners();
});

// ==========================================
// 2. Auth & User Listener Logic
// ==========================================

// Handle Protected Actions (Check auth before running callback)
function handleProtectedAction(actionCallback) {
  if (!requireAuth()) return;
  if (typeof actionCallback === 'function') {
    actionCallback();
  }
}

// Handle Auth Change (Logged In vs Guest View)
auth.onAuthStateChanged(user => {
  if (unsubscribeUserListener) {
    unsubscribeUserListener();
    unsubscribeUserListener = null;
  }

  if (user) {
    currentUser = user;
    toggleAuthModal(false); 
    const layout = document.getElementById('app-layout');
    if (layout) layout.classList.remove('blurred');
    listenToUserData(user.uid);
  } else {
    currentUser = null;
    const layout = document.getElementById('app-layout');
    if (layout) layout.classList.remove('blurred');
    
    // Default mock Guest data
    userData = {
      name: currentLang === 'AR' ? 'زائر' : 'Guest User',
      xp: 0,
      level: 1,
      streak: 1,
      items: [
        { id: '1', type: 'task', text: currentLang === 'AR' ? 'مهمة توضيحية (سجّل دخولك لإضافة مهامك)' : 'Sample task (Sign in to add yours)', completed: false }
      ]
    };
    updateUI();
  }
});

// Real-time Firestore Sync
function listenToUserData(uid) {
  unsubscribeUserListener = db.collection('users').doc(uid).onSnapshot(doc => {
    if (doc.exists) {
      userData = doc.data();
      if (!userData.items) userData.items = [];
    } else {
      // First-time user document setup
      userData = {
        name: currentUser.displayName || (currentLang === 'AR' ? 'مستخدم' : 'User'),
        email: currentUser.email || '',
        xp: 0,
        level: 1,
        streak: 1,
        items: []
      };
      saveToFirebase();
    }
    updateUI();
  }, err => {
    console.error("Firestore Listen Error: ", err);
  });
}

// Save User State
function saveToFirebase() {
  if (currentUser) {
    db.collection('users').doc(currentUser.uid).set(userData, { merge: true });
  }
}

// Require Auth Guard
function requireAuth() {
  if (!currentUser) {
    toggleAuthModal(true);
    return false;
  }
  return true;
}

// Authentication Submit Action
function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email')?.value;
  const pass = document.getElementById('auth-pass')?.value;
  const name = document.getElementById('auth-name')?.value || 'User';

  if (!email || !pass) return;

  if (isSignUpMode) {
    auth.createUserWithEmailAndPassword(email, pass)
      .then(cred => {
        return cred.user.updateProfile({ displayName: name }).then(() => {
          userData.name = name;
          saveToFirebase();
        });
      })
      .catch(err => showNotification(err.message, 'error'));
  } else {
    auth.signInWithEmailAndPassword(email, pass)
      .catch(err => showNotification(err.message, 'error'));
  }
}

// Handle User Actions (Log In / Log Out)
function handleAuthAction() {
  if (currentUser) {
    logoutUser();
  } else {
    toggleAuthModal(true);
  }
}

// Sign Out
function logoutUser() {
  auth.signOut();
}

// Switch between Sign In / Sign Up Forms
function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  const nameField = document.getElementById('name-field');
  const title = document.getElementById('auth-title');
  const submitBtn = document.getElementById('auth-submit-btn');
  const switchText = document.getElementById('auth-switch-text');
  const switchLink = document.getElementById('auth-switch-link');
  const t = i18nTranslations[currentLang];

  if (isSignUpMode) {
    if (nameField) nameField.classList.remove('hidden');
    if (title) title.innerText = t.signup_title;
    if (submitBtn) submitBtn.innerText = t.signup_btn;
    if (switchText) switchText.innerText = t.has_account;
    if (switchLink) switchLink.innerText = t.login_link;
  } else {
    if (nameField) nameField.classList.add('hidden');
    if (title) title.innerText = t.login_title;
    if (submitBtn) submitBtn.innerText = t.login_btn;
    if (switchText) switchText.innerText = t.no_account;
    if (switchLink) switchLink.innerText = t.signup_link;
  }
}

// Open / Close Login Modal
function toggleAuthModal(show) {
  const modal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  if (!modal) return;
  
  if (show) {
    modal.classList.remove('hidden');
    if (currentUser && closeBtn) closeBtn.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

// Simple Custom Notification
function showNotification(message, type = 'info') {
  alert(message);
}

// ==========================================
// 3. UI Update & Render Operations
// ==========================================

// Re-render Page Elements
function updateUI() {
  const userName = currentUser ? (currentUser.displayName || userData.name || 'Achiever') : (currentLang === 'AR' ? 'زائر' : 'Guest');
  
  const navUser = document.getElementById('nav-user-name');
  const welcomeUser = document.getElementById('welcome-user-name');
  const pointsVal = document.getElementById('points-val');
  const streakVal = document.getElementById('streak-val');
  const levelVal = document.getElementById('level-val');
  const currentXpSpan = document.getElementById('current-xp-span');

  if (navUser) navUser.innerText = userName;
  if (welcomeUser) welcomeUser.innerText = userName;
  if (pointsVal) pointsVal.innerText = userData.xp || 0;
  if (streakVal) streakVal.innerText = userData.streak || 1;
  if (levelVal) levelVal.innerText = userData.level || 1;
  if (currentXpSpan) currentXpSpan.innerText = (userData.xp || 0) % 100;

  const xpPercent = ((userData.xp || 0) % 100);
  const xpBar = document.getElementById('xp-bar-fill');
  if (xpBar) xpBar.style.width = `${xpPercent}%`;

  const authText = document.getElementById('auth-action-text');
  const authIcon = document.getElementById('auth-action-icon');
  const t = i18nTranslations[currentLang];

  if (authText) authText.innerText = currentUser ? t.logout_btn : t.login_btn;
  if (authIcon) authIcon.className = currentUser ? 'fa-solid fa-right-from-bracket' : 'fa-solid fa-right-to-bracket';

  renderTasks();
  renderBrainDump();
}

// Render Tasks
function renderTasks() {
  const dashList = document.getElementById('dash-task-list');
  const questList = document.getElementById('full-quest-list');
  if (!dashList && !questList) return;

  const tasks = (userData.items || []).filter(item => item.type === 'task');
  
 const generateTaskHTML = (task) => `
  <li class="task-row ${task.completed ? 'completed' : ''}">
    <div class="task-left" onclick="toggleTask('${task.id}')" style="cursor: pointer;">
      <span class="priority-dot ${task.completed ? 'completed-dot' : 'high'}"></span>
      <span class="task-title ${task.completed ? 'completed-text' : ''}">${escapeHTML(task.text)}</span>
    </div>

    <div class="item-actions">
      <span class="xp-tag ${task.completed ? 'xp-done' : ''}">
        ${task.completed ? '+15 XP' : '15 XP'}
      </span>
      <button class="action-icon-btn" onclick="openEditModal('${task.id}')" title="تعديل">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="action-icon-btn delete-btn" onclick="deleteItem('${task.id}')" title="حذف">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  </li>
`;

  const emptyText = currentLang === 'AR' ? 'لا توجد مهام حالياً.' : 'No tasks yet.';
  if (dashList) dashList.innerHTML = tasks.length ? tasks.map(generateTaskHTML).join('') : `<p class="text-muted" style="padding:10px;">${emptyText}</p>`;
  if (questList) questList.innerHTML = tasks.length ? tasks.map(generateTaskHTML).join('') : `<p class="text-muted" style="padding:10px;">${emptyText}</p>`;

  const completedCount = tasks.filter(t => t.completed).length;
  const completedElem = document.getElementById('completed-count');
  if (completedElem) completedElem.innerText = `${completedCount} / ${tasks.length}`;
  
  const rate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const rateElem = document.getElementById('task-completion-rate');
  if (rateElem) rateElem.innerText = `${rate}%`;
}

// Render Ideas & Events
function renderBrainDump() {
  const ideasList = document.getElementById('ideas-list');
  const eventsList = document.getElementById('events-list');
  if (!ideasList && !eventsList) return;

  const ideas = (userData.items || []).filter(i => i.type === 'idea');
  const events = (userData.items || []).filter(i => i.type === 'event');

  const generateDumpHTML = (item) => `
  <li class="task-row">
    <div class="task-left">
      <span class="priority-dot med"></span>
      <span class="task-title">${escapeHTML(item.text)}</span>
    </div>

    <div class="item-actions">
      <button class="action-icon-btn" onclick="openEditDumpModal('${item.id}')" title="تعديل">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="action-icon-btn delete-btn" onclick="deleteDumpItem('${item.id}')" title="حذف">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  </li>
`;

  const emptyIdeas = currentLang === 'AR' ? 'لا توجد أفكار مدونة.' : 'No ideas captured.';
  const emptyEvents = currentLang === 'AR' ? 'لا توجد أحداث مدونة.' : 'No events logged.';

  if (ideasList) ideasList.innerHTML = ideas.length ? ideas.map(generateDumpHTML).join('') : `<p class="text-muted" style="padding:10px;">${emptyIdeas}</p>`;
  if (eventsList) eventsList.innerHTML = events.length ? events.map(generateDumpHTML).join('') : `<p class="text-muted" style="padding:10px;">${emptyEvents}</p>`;
}

// ==========================================
// 4. Data CRUD Operations (Add, Toggle, Delete)
// ==========================================

// Add Items (Works for Tasks, Ideas, and Events)
function addDumpItem(type, inputId = 'dash-brain-input') {
  if (!requireAuth()) return;

  const input = document.getElementById(inputId);
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const newItem = {
    id: Date.now().toString(),
    type: type, // 'task', 'idea', or 'event'
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };

  if (!userData.items) userData.items = [];
  userData.items.push(newItem);
  input.value = '';
  
  saveToFirebase();
  updateUI();
}

// Toggle Task Completion State & Update XP
function toggleTask(id) {
  if (!requireAuth()) return;

  const item = (userData.items || []).find(i => i.id === id);
  if (item) {
    item.completed = !item.completed;
    if (item.completed) {
      userData.xp = (userData.xp || 0) + 15;
    } else {
      userData.xp = Math.max(0, (userData.xp || 0) - 15);
    }
    userData.level = Math.floor((userData.xp || 0) / 100) + 1; 
    saveToFirebase();
    updateUI();
  }
}

// Delete Item
function deleteItem(id) {
  if (!requireAuth()) return;

  userData.items = (userData.items || []).filter(i => i.id !== id);
  saveToFirebase();
  updateUI();
}

// Open Edit Modal
function openEditModal(id) {
  if (!requireAuth()) return;

  const item = (userData.items || []).find(i => i.id === id);
  if (item) {
    editingItemId = id;
    const editInput = document.getElementById('edit-item-input');
    if (editInput) editInput.value = item.text;
    
    const editModal = document.getElementById('edit-modal');
    if (editModal) editModal.classList.remove('hidden');
  }
}

// Close Edit Modal
function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  if (modal) modal.classList.add('hidden');
  editingItemId = null;
}

// Save Edited Item Text
function saveEditedItem() {
  const editInput = document.getElementById('edit-item-input');
  if (!editInput) return;
  
  const newText = editInput.value.trim();
  if (newText && editingItemId) {
    const item = (userData.items || []).find(i => i.id === editingItemId);
    if (item) {
      item.text = newText;
      saveToFirebase();
      updateUI();
    }
  }
  closeEditModal();
}

// ==========================================
// 5. Theme & Language Helpers
// ==========================================

function setupTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('himmah_theme', currentTheme);
      updateThemeIcon();
    });
  }
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = currentTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

function setupLanguage() {
  applyLanguage(currentLang);

  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'EN' ? 'AR' : 'EN';
      localStorage.setItem('himmah_lang', currentLang);
      applyLanguage(currentLang);
    });
  }
}

function applyLanguage(lang) {
  const html = document.documentElement;
  html.setAttribute('lang', lang.toLowerCase());
  html.setAttribute('dir', lang === 'AR' ? 'rtl' : 'ltr');

  const langCodeSpan = document.getElementById('lang-code');
  if (langCodeSpan) {
    langCodeSpan.innerText = lang === 'AR' ? 'EN' : 'AR';
  }

  const translations = i18nTranslations[lang];
  if (!translations) return;

  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (translations[key]) {
      elem.innerText = translations[key];
    }
  });

  document.querySelectorAll('[data-i18n-ph]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-ph');
    if (translations[key]) {
      elem.setAttribute('placeholder', translations[key]);
    }
  });

  updateUI();
}

// ==========================================
// 6. Navigation & General Event Listeners
// ==========================================

function switchTab(tabName, clickedElement) {
  document.querySelectorAll('.spa-section').forEach(sec => {
    sec.classList.add('hidden-section');
    sec.classList.remove('active-section');
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const activeSec = document.getElementById(`sec-${tabName}`);
  if (activeSec) {
    activeSec.classList.remove('hidden-section');
    activeSec.classList.add('active-section');
  }

  if (clickedElement) {
    clickedElement.classList.add('active');
  }
}

function setupEventListeners() {
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }

  // Handle Enter key on Dash input
  const dashInput = document.getElementById('dash-brain-input');
  if (dashInput) {
    dashInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleProtectedAction(() => addDumpItem('task', 'dash-brain-input'));
      }
    });
  }

  // Handle Enter key on Full Brain Dump input
  const fullInput = document.getElementById('full-brain-input');
  if (fullInput) {
    fullInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleProtectedAction(() => addDumpItem('task', 'full-brain-input'));
      }
    });
  }
}

// HTML Escape Helper
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Make critical functions accessible globally for inline HTML events
window.handleProtectedAction = handleProtectedAction;
window.addDumpItem = addDumpItem;
window.toggleTask = toggleTask;
window.deleteItem = deleteItem;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditedItem = saveEditedItem;
window.toggleAuthModal = toggleAuthModal;
window.toggleAuthMode = toggleAuthMode;
window.handleAuthAction = handleAuthAction;
window.switchTab = switchTab;
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('menuToggleBtn');
  
  if (sidebar && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});