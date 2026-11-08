// StreamLock Professional Multi-Page Engine
const DB_NAME = 'StreamLockDB';
const DB_VERSION = 4;
const STORE_VIDEOS = 'video_blobs';

function openVideoDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_VIDEOS)) {
        db.createObjectStore(STORE_VIDEOS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveVideoFileToDB(id, file) {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIDEOS, 'readwrite');
    const store = tx.objectStore(STORE_VIDEOS);
    store.put({
      id: id,
      blob: file,
      name: file.name,
      type: file.type || 'video/mp4',
      size: file.size,
      updatedAt: Date.now()
    });
    tx.oncomplete = () => { slCloudUploadMedia(id,file).then(() => resolve(true)).catch(() => resolve(true)); };
    tx.onerror = () => reject(tx.error);
  });
}

async function loadLocalVideoBlobURL(id) {
  try {
    const db = await openVideoDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_VIDEOS, 'readonly');
      const store = tx.objectStore(STORE_VIDEOS);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          const type = req.result.type || 'video/mp4';
          const cleanBlob = new Blob([req.result.blob], { type });
          const url = URL.createObjectURL(cleanBlob);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function loadVideoBlobURL(id) {
  const local = await loadLocalVideoBlobURL(id);
  if (local) return local;
  if (!window.slSupabase) return null;
  try {
    const { data,error } = await window.slSupabase.from('media_files').select('public_url').eq('id',id).maybeSingle();
    if (error) throw error;
    return data && data.public_url ? data.public_url : null;
  } catch (e) {
    console.warn('StreamLock cloud media lookup failed:',e.message || e);
    return null;
  }
}

// Master Database: Developer credentials configured
const DEFAULT_APP_DATA = {
  users: [
    {
      id: "admin-master",
      role: "admin",
      username: "yashmacaraya",
      email: "yashmacaraya123@gmail.com",
      phone: "09171234567",
      password: "",
      name: "Yash Macaraya (Developer)",
      favorites: []
    },
    {
      id: "user-demo",
      role: "user",
      username: "viewer",
      email: "viewer@gmail.com",
      phone: "09180001111",
      password: "",
      name: "Standard Viewer",
      favorites: ["group-1"]
    }
  ],
  settings: {
    siteName: "StreamLock Pay",
    cpmRewarded: 8.50,
    cpmBanner: 1.80,
    conversionRate: 58.50,
    payoutMethod: "GCash",
    gcashNumber: "0917-123-4567",
    gcashName: "Content Creator",
    minWithdrawalPHP: 200,
    topBannerAd: {
      title: "Ultra Cloud Hosting & VPN",
      subtitle: "Instant DDoS defense & 60% promo.",
      linkUrl: "https://google.com",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      buttonText: "Claim 60% OFF "
    },
    sidebarBannerAd1: {
      title: "Mobile Action Tournament",
      subtitle: "Join live battle royale online now.",
      linkUrl: "https://google.com",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      buttonText: "Play Now ",
      icon: ""
    },
    sidebarBannerAd2: {
      title: "Instant E-Wallet Cash Games",
      subtitle: "Withdraw jackpots straight to GCash.",
      linkUrl: "https://google.com",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      buttonText: "Claim Cash ",
      icon: ""
    },
    bottomBannerAd: {
      title: "Verified Partner Discounts",
      subtitle: "Exclusive curated deals for viewers.",
      linkUrl: "https://google.com",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
      buttonText: "Learn More "
    }
  },
  stats: {
    totalUnlocks: 48,
    bannerImpressions: 165,
    rewardedAdCompletes: 48,
    estimatedEarningsUSD: 0.705,
    paidOutPHP: 0
  },
  groups: [
    {
      id: "group-1",
      title: "Trending Gaming & Action Collection",
      description: "Top viral highlights, tournament tricks and battle compilations.",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
      videoIds: ["demo-v1", "demo-v2"],
      createdAt: new Date().toISOString()
    },
    {
      id: "group-2",
      title: "4K Cinematic & Drone Reels",
      description: "Aerial landscapes, cinematic clips and nature preview reels.",
      thumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80",
      videoIds: ["demo-v1"],
      createdAt: new Date().toISOString()
    }
  ],
  links: [
    {
      id: "demo-v1",
      title: "Exclusive Cinematic Drone 4K Preview",
      description: "Watch the full 1-minute 4K aerial footage by unlocking the rewarded sponsor ad.",
      videoSourceType: "url",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80",
      rewardAdDuration: 10,
      rewardTitle: "Top Action Shooter: Free 1,000 Starter Gems",
      rewardContent: "Join millions of players in real-time PvP combat. Claim your free legendary starter weapon now!",
      rewardAdLink: "https://google.com",
      rewardAdVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
      featuredNextVideoId: "demo-v2",
      selectedNextIds: ["demo-v2"],
      views: 48
    },
    {
      id: "demo-v2",
      title: "Fast Gaming Highlights & Secret Tricks",
      description: "Watch special gaming trick compilation and tournament winning moments.",
      videoSourceType: "url",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
      rewardAdDuration: 8,
      rewardTitle: "Cloud VPN 70% Instant Discount",
      rewardContent: "Browse securely with gigabit speeds worldwide. 30-day money-back guarantee.",
      rewardAdLink: "https://google.com",
      rewardAdVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      featuredNextVideoId: "demo-v1",
      selectedNextIds: ["demo-v1"],
      views: 32
    }
  ],
  transactions: [
    { id: "tx-1", date: "2026-11-06 14:22", amountPHP: 550, status: "Completed", method: "GCash (0917-123-4567)" }
  ]
};

function normalizeAppData(data) {
  if (!data || typeof data !== 'object') data = {};
  if (!data.settings) data.settings = {};
  if (!Array.isArray(data.links)) data.links = [];
  if (!Array.isArray(data.stats)) data.stats = data.stats || {};

  // One central banner collection. Older saved sites are migrated automatically.
  if (!Array.isArray(data.settings.ads)) {
    const legacy = [
      ['ad-top', 'Top Video Banner', data.settings.topBannerAd, ['profile', 'groups'], '#38bdf8', 'spark'],
      ['ad-side-1', 'Sponsor Banner 1', data.settings.sidebarBannerAd1, ['watch'], '#f5a623', 'game'],
      ['ad-side-2', 'Sponsor Banner 2', data.settings.sidebarBannerAd2, ['watch'], '#34d399', 'coin'],
      ['ad-bottom', 'Partner Banner', data.settings.bottomBannerAd, ['watch'], '#38bdf8', 'shield']
    ];
    data.settings.ads = legacy.filter(item => item[2]).map(item => ({
      id: item[0],
      name: item[1],
      kind: 'banner',
      title: item[2].title || item[1],
      subtitle: item[2].subtitle || '',
      linkUrl: item[2].linkUrl || 'https://google.com',
      videoUrl: item[2].videoUrl || '',
      videoSourceType: item[2].videoSourceType || 'url',
      buttonText: item[2].buttonText || 'Learn More',
      icon: item[2].icon || item[5],
      color: item[4],
      placements: item[3],
      enabled: item[2].enabled !== false,
      loop: item[2].loop !== false
    }));
  }

  data.settings.ads = data.settings.ads.map((ad, index) => ({
    id: ad.id || ('ad-' + Date.now().toString(36) + '-' + index),
    name: ad.name || ad.title || ('Banner ' + (index + 1)),
    kind: 'banner',
    title: ad.title || '',
    subtitle: ad.subtitle || '',
    linkUrl: ad.linkUrl || 'https://google.com',
    videoUrl: ad.videoUrl || '',
    videoSourceType: ad.videoSourceType || ((ad.videoUrl || '').startsWith('indexeddb://') ? 'file' : 'url'),
    buttonText: ad.buttonText || 'Learn More',
    icon: ad.icon || 'spark',
    iconUrl: ad.iconUrl || '',
    color: ad.color || '#00f2fe',
    placements: Array.isArray(ad.placements) ? ad.placements : ['watch'],
    enabled: ad.enabled !== false,
    loop: ad.loop !== false
  }));
  return data;
}

function getLocalData() {
  const stored = localStorage.getItem('streamlock_app_data');
  if (!stored) {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
    const normalized = normalizeAppData(fresh);
    localStorage.setItem('streamlock_app_data', JSON.stringify(normalized));
    return slDeepClean(normalized);
  }
  try {
    const parsed = JSON.parse(stored);
    return slDeepClean(normalizeAppData(parsed));
  } catch (e) {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
    return slDeepClean(normalizeAppData(fresh));
  }
}

const SL_CLOUD = { initialized:false, initPromise:null, saveTimer:null, syncing:false };

function saveLocalData(data) {
  localStorage.setItem('streamlock_app_data', JSON.stringify(data));
  slCloudQueueSave(data);
}

function slCloudContent(data) {
  // Never upload local account records, passwords, sessions, or transactions.
  return JSON.parse(JSON.stringify({
    settings:data.settings || {}, groups:data.groups || [], links:data.links || [], stats:data.stats || {}
  }));
}

async function slCloudPushState(data) {
  if (!window.slSupabase || !isDeveloperAccount()) return false;
  try {
    const { error } = await window.slSupabase.from('site_state').upsert({
      id:1,payload:slCloudContent(data),updated_at:new Date().toISOString()
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('StreamLock cloud save failed:',e.message || e);
    if (typeof showToast === 'function') showToast('Saved locally; cloud sync failed');
    return false;
  }
}

function slCloudQueueSave(data) {
  if (!window.slSupabase || !SL_CLOUD.initialized || !isDeveloperAccount()) return;
  if (SL_CLOUD.saveTimer) clearTimeout(SL_CLOUD.saveTimer);
  SL_CLOUD.saveTimer = setTimeout(() => slCloudPushState(data),450);
}

async function slCloudSyncSession(authSession) {
  SL_CLOUD.syncing = true;
  try {
    if (!authSession || !authSession.user) {
      localStorage.removeItem('streamlock_session');
      return;
    }
    const user = authSession.user;
    const [{ data:profile,error:profileError },{ data:favorites,error:favoritesError }] = await Promise.all([
      window.slSupabase.from('profiles').select('username,full_name,role').eq('id',user.id).maybeSingle(),
      window.slSupabase.from('favorites').select('group_id').eq('user_id',user.id)
    ]);
    if (profileError) throw profileError;
    if (favoritesError) throw favoritesError;
    const session = {
      id:user.id, email:user.email || '', role:profile && profile.role === 'admin' ? 'admin' : 'user',
      username:(profile && profile.username) || (user.user_metadata && user.user_metadata.username) || '',
      name:(profile && profile.full_name) || (user.user_metadata && user.user_metadata.full_name) || 'Viewer',
      favorites:(favorites || []).map(item => item.group_id)
    };
    localStorage.setItem('streamlock_session',JSON.stringify(session));
  } catch (e) {
    console.warn('StreamLock profile sync failed:',e.message || e);
  } finally { SL_CLOUD.syncing = false; }
}

async function slCloudPull() {
  if (!window.slSupabase) return;
  const [stateResult,statsResult,viewsResult] = await Promise.all([
    window.slSupabase.from('site_state').select('payload,updated_at').eq('id',1).maybeSingle(),
    window.slSupabase.from('site_stats').select('*').eq('id',1).maybeSingle(),
    window.slSupabase.from('video_views').select('video_id,views')
  ]);
  if (stateResult.error) throw stateResult.error;
  if (statsResult.error) throw statsResult.error;
  if (viewsResult.error) throw viewsResult.error;
  const local = getLocalData();
  const cloud = stateResult.data && stateResult.data.payload;
  if (cloud && Array.isArray(cloud.links)) {
    local.settings = cloud.settings || local.settings;
    local.groups = Array.isArray(cloud.groups) ? cloud.groups : [];
    local.links = cloud.links;
    local.stats = cloud.stats || local.stats;
  }
  if (statsResult.data) {
    local.stats = {
      ...local.stats,
      totalUnlocks:Number(statsResult.data.total_unlocks) || 0,
      bannerImpressions:Number(statsResult.data.banner_impressions) || 0,
      rewardedAdCompletes:Number(statsResult.data.rewarded_ad_completes) || 0,
      estimatedEarningsUSD:Number(statsResult.data.estimated_earnings_usd) || 0
    };
  }
  const views = new Map((viewsResult.data || []).map(row => [row.video_id,Number(row.views) || 0]));
  local.links.forEach(link => { if (views.has(link.id)) link.views = views.get(link.id); });
  localStorage.setItem('streamlock_app_data',JSON.stringify(slDeepClean(normalizeAppData(local))));
  if (!stateResult.data && isDeveloperAccount()) await slCloudPushState(local);
}

async function slCloudInitialize() {
  if (SL_CLOUD.initPromise) return SL_CLOUD.initPromise;
  SL_CLOUD.initPromise = (async () => {
    if (!window.slSupabase) return;
    try {
      const { data,error } = await window.slSupabase.auth.getSession();
      if (error) throw error;
      await slCloudSyncSession(data.session);
      await slCloudPull();
    } catch (e) {
      console.warn('StreamLock cloud initialization failed; using local cache:',e.message || e);
    } finally { SL_CLOUD.initialized = true; }
  })();
  return SL_CLOUD.initPromise;
}

async function slCloudUploadMedia(id,file) {
  if (!window.slSupabase || !isDeveloperAccount()) return false;
  try {
    const session = getCurrentSession();
    const extension = (file.name && file.name.includes('.') ? file.name.split('.').pop() : 'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g,'-');
    const path = session.id + '/' + safeId + (extension ? '.' + extension : '');
    const { error } = await window.slSupabase.storage.from('streamlock-media').upload(path,file,{
      upsert:true,contentType:file.type || 'application/octet-stream',cacheControl:'3600'
    });
    if (error) throw error;
    const { data:urlData } = window.slSupabase.storage.from('streamlock-media').getPublicUrl(path);
    const { error:metaError } = await window.slSupabase.from('media_files').upsert({
      id,path,public_url:urlData.publicUrl,mime_type:file.type || '',size_bytes:file.size || 0,
      uploaded_by:session.id,updated_at:new Date().toISOString()
    });
    if (metaError) throw metaError;
    return true;
  } catch (e) {
    console.error('StreamLock media upload failed:',e.message || e);
    if (typeof showToast === 'function') showToast('Media saved locally; cloud upload failed');
    return false;
  }
}

async function slCloudSaveFavorites(previous,current) {
  if (!window.slSupabase || SL_CLOUD.syncing || !current || !current.id) return;
  const before = new Set(previous && previous.favorites || []);
  const after = new Set(current.favorites || []);
  const added = [...after].filter(id => !before.has(id));
  const removed = [...before].filter(id => !after.has(id));
  try {
    if (removed.length) {
      const { error } = await window.slSupabase.from('favorites').delete().eq('user_id',current.id).in('group_id',removed);
      if (error) throw error;
    }
    if (added.length) {
      const { error } = await window.slSupabase.from('favorites').insert(added.map(group_id => ({user_id:current.id,group_id})));
      if (error) throw error;
    }
  } catch (e) { console.error('Favorite cloud sync failed:',e.message || e); }
}

async function slCloudRecordActivity(activity) {
  if (!window.slSupabase) return;
  try {
    const { error } = await window.slSupabase.rpc('sl_record_activity',{
      p_video_id:activity.videoId || null,p_unlocks:activity.unlocks || 0,
      p_rewards:activity.rewards || 0,p_banner:activity.banner || 0,p_earnings:activity.earnings || 0
    });
    if (error) throw error;
  } catch (e) { console.warn('Shared activity sync failed:',e.message || e); }
}

async function slBoot(callback) {
  await slCloudInitialize();
  const nav = document.getElementById('sl-nav-root');
  if (nav) { nav.remove(); injectGlobalNav(); }
  if (typeof callback === 'function') await callback();
  mountPageAdBanners();
  hydrateIndexedImages(document.body);
  slHydrate(document.body);
}


function getCurrentSession() {
  const s = localStorage.getItem('streamlock_session');
  if (!s) return null;
  try { return JSON.parse(s); } catch (e) { return null; }
}

function setCurrentSession(user) {
  const previous = getCurrentSession();
  localStorage.setItem('streamlock_session', JSON.stringify(user));
  slCloudSaveFavorites(previous,user);
}

function clearSession() {
  localStorage.removeItem('streamlock_session');
  if (window.slSupabase) window.slSupabase.auth.signOut({scope:'local'}).catch(() => {});
}

function isDeveloperAccount() {
  const session = getCurrentSession();
  return !!(session && session.role === 'admin' && session.id);
}

function enforceAdminAuth() {
  if (!isDeveloperAccount()) {
    slAlert('Access Restricted: Only the Developer (yashmacaraya123@gmail.com) can access this page.');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Convert video URL (Drive, Dropbox, YouTube, etc.)
function optimizeVideoSource(rawUrl) {
  if (!rawUrl) return '';
  const url = rawUrl.trim();
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || (url.includes('drive.google.com') ? url.match(/id=([a-zA-Z0-9_-]+)/) : null);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  if (url.includes('dropbox.com')) {
    return url.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
  }
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }
  return url;
}

/* Stored thumbnail helpers (IndexedDB-backed uploads) */
async function resolveStoredImage(source) {
  const raw = String(source || '');
  if (!raw.startsWith('indexeddb://')) return raw;
  return await loadVideoBlobURL(raw.slice(12)) || '';
}

function hydrateIndexedImages(root) {
  const base = root && root.querySelectorAll ? root : document;
  base.querySelectorAll('img[src^="indexeddb://"]').forEach(async img => {
    const source = img.getAttribute('src');
    const url = await resolveStoredImage(source);
    if (url && img.isConnected) img.src = url;
  });
}

/* Website-styled dialogs; no native browser announcement chrome. */
function slOpenDialog(message, choices, title) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'sl-dialog-overlay';
    overlay.innerHTML = '<div class="sl-dialog" role="dialog" aria-modal="true" aria-labelledby="sl-dialog-title"><div class="sl-dialog-mark"><span class="sl-ic">' + SLIcon('bolt') + '</span></div><h2 id="sl-dialog-title"></h2><p class="sl-dialog-message"></p><div class="sl-dialog-actions"></div></div>';
    overlay.querySelector('h2').textContent = title || 'StreamLock';
    overlay.querySelector('.sl-dialog-message').textContent = String(message || '');
    const actions = overlay.querySelector('.sl-dialog-actions');
    const close = value => { overlay.remove(); document.removeEventListener('keydown',onKey); resolve(value); };
    choices.forEach((choice,index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'sl-dialog-button ' + (choice.primary ? 'primary' : '');
      button.textContent = choice.label; button.addEventListener('click',() => close(choice.value));
      actions.appendChild(button); if (index === choices.length - 1) setTimeout(() => button.focus(),0);
    });
    const onKey = event => { if (event.key === 'Escape') close(false); if (event.key === 'Enter' && choices.length === 1) close(true); };
    document.addEventListener('keydown',onKey);
    overlay.addEventListener('click',event => { if (event.target === overlay && choices.length > 1) close(false); });
    document.body.appendChild(overlay);
  });
}
function slAlert(message,title) { return slOpenDialog(message,[{label:'OK',value:true,primary:true}],title || 'StreamLock'); }
function slConfirm(message,title) { return slOpenDialog(message,[{label:'Cancel',value:false},{label:'Continue',value:true,primary:true}],title || 'Please confirm'); }

/* ============================================================
   Adaptive media URLs — direct files, uploads, and platform embeds
   ============================================================ */
function getPlatformMedia(rawUrl, options = {}) {
  const url = String(rawUrl || '').trim();
  const autoplay = options.autoplay !== false;
  const muted = options.muted !== false;
  const loop = options.loop !== false;
  if (!url) return { type:'none', src:'' };
  if (url.startsWith('indexeddb://')) return { type:'file', id:url.slice(12), src:url };
  if (!/^https?:\/\//i.test(url)) return { type:'none', src:'' };

  let match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|watch\?.+&v=))([\w-]{11})/i);
  if (match) {
    const id = match[1];
    return { type:'iframe', platform:'youtube', src:'https://www.youtube.com/embed/' + id + '?autoplay=' + (autoplay ? 1 : 0) + '&mute=' + (muted ? 1 : 0) + '&loop=' + (loop ? 1 : 0) + '&playlist=' + id + '&controls=' + (options.controls === false ? 0 : 1) + '&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1' };
  }

  match = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/i) || (url.includes('drive.google.com') ? url.match(/[?&]id=([\w-]+)/i) : null);
  if (match) return { type:'iframe', platform:'drive', src:'https://drive.google.com/file/d/' + match[1] + '/preview' };
  if (url.includes('dropbox.com')) {
    const direct = url.replace(/([?&])dl=0/g, '$1raw=1').replace(/([?&])dl=1/g, '$1raw=1');
    return { type:'video', platform:'dropbox', src:direct + (direct.includes('raw=1') ? '' : (direct.includes('?') ? '&raw=1' : '?raw=1')) };
  }

  match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (match) return { type:'iframe', platform:'vimeo', src:'https://player.vimeo.com/video/' + match[1] + '?autoplay=' + (autoplay ? 1 : 0) + '&muted=' + (muted ? 1 : 0) + '&loop=' + (loop ? 1 : 0) + '&controls=' + (options.controls === false ? 0 : 1) + '&api=1' };
  match = url.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([\w]+)/i);
  if (match) return { type:'iframe', platform:'dailymotion', src:'https://www.dailymotion.com/embed/video/' + match[1] + '?autoplay=' + (autoplay ? 1 : 0) + '&mute=' + (muted ? 1 : 0) };
  if (/facebook\.com|fb\.watch/i.test(url)) return { type:'iframe', platform:'facebook', src:'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url) + '&show_text=false&autoplay=' + (autoplay ? 'true' : 'false') + '&mute=' + (muted ? 'true' : 'false') };
  match = url.match(/tiktok\.com\/.+\/video\/(\d+)/i);
  if (match) return { type:'iframe', platform:'tiktok', src:'https://www.tiktok.com/embed/v2/' + match[1] + '?autoplay=' + (autoplay ? 1 : 0) };
  match = url.match(/instagram\.com\/(?:reel|p|tv)\/([\w-]+)/i);
  if (match) return { type:'iframe', platform:'instagram', src:'https://www.instagram.com/' + (url.includes('/p/') ? 'p' : url.includes('/tv/') ? 'tv' : 'reel') + '/' + match[1] + '/embed' };
  match = url.match(/clips\.twitch\.tv\/([\w-]+)/i);
  if (match) return { type:'iframe', platform:'twitch', src:'https://clips.twitch.tv/embed?clip=' + match[1] + '&parent=' + location.hostname + '&autoplay=' + autoplay + '&muted=' + muted };
  match = url.match(/twitch\.tv\/videos\/(\d+)/i);
  if (match) return { type:'iframe', platform:'twitch', src:'https://player.twitch.tv/?video=' + match[1] + '&parent=' + location.hostname + '&autoplay=' + autoplay + '&muted=' + muted };

  if (/\.(mp4|webm|ogv|ogg|mov|m4v|m3u8)(?:$|[?#])/i.test(url)) return { type:'video', platform:'direct', src:url };
  // Unknown platforms are attempted as embeds; individual hosts may still block framing.
  return { type:'iframe', platform:'generic', src:url };
}

function slLockSponsorPlayback(media) {
  if (!media || media.tagName !== 'VIDEO') return;
  media.controls = false;
  media.disablePictureInPicture = true;
  media.disableRemotePlayback = true;
  media.setAttribute('controlsList','nodownload noplaybackrate noremoteplayback');
  media.setAttribute('tabindex','-1');
  media.playbackRate = 1;
  let lastTime = 0;
  media.addEventListener('timeupdate',() => { lastTime = media.currentTime; });
  media.addEventListener('pause',() => {
    if (!media.ended && media.isConnected) media.play().catch(() => {});
  });
  media.addEventListener('seeking',() => {
    if (Math.abs(media.currentTime - lastTime) > 0.75) media.currentTime = lastTime;
  });
  media.addEventListener('ratechange',() => { if (media.playbackRate !== 1) media.playbackRate = 1; });
  media.addEventListener('volumechange',() => { if (!media.muted) media.muted = true; });
  media.addEventListener('contextmenu',event => event.preventDefault());
}

async function mountAdaptiveMedia(container, rawUrl, options = {}) {
  if (!container) return null;
  container.innerHTML = '';
  let info = getPlatformMedia(rawUrl, options);
  if (info.type === 'none') return null;
  if (info.type === 'file') {
    const url = await loadVideoBlobURL(options.fileId || info.id);
    if (!url) return null;
    info = { type:'video', platform:'upload', src:url };
  }
  const media = document.createElement(info.type === 'iframe' ? 'iframe' : 'video');
  media.className = options.className || 'sl-adaptive-media';
  media.src = info.src;
  media.dataset.platform = info.platform || 'direct';
  if (info.type === 'iframe') {
    media.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write';
    media.allowFullscreen = !options.lockPlayback;
    if (options.controls === false) media.tabIndex = -1;
    media.frameBorder = '0';
    media.loading = options.eager ? 'eager' : 'lazy';
    media.classList.add('ready');
  } else {
    media.autoplay = options.autoplay !== false;
    media.muted = options.muted !== false;
    media.defaultMuted = options.muted !== false;
    media.loop = options.loop !== false;
    media.controls = options.controls === true;
    media.playsInline = true;
    media.preload = options.preload || 'metadata';
    if (options.lockPlayback) slLockSponsorPlayback(media);
    media.addEventListener('loadeddata', () => media.classList.add('ready'), { once:true });
  }
  container.appendChild(media);
  if (info.type !== 'iframe' && media.autoplay) media.play().catch(() => {});
  return media;
}

function getVideoQualities(video) {
  if (!video) return [];
  const originalUrl = video.videoUrl || '';
  const qualities = [];
  if (originalUrl) qualities.push({
    id:'original', label:'Auto', height:0, rewarded:false,
    url:originalUrl, sourceType:video.videoSourceType || 'url', fileId:video.id
  });

  // Premium quality uses real uploaded renditions. Legacy URL renditions are
  // intentionally ignored because a URL label alone is not proof of quality.
  const uploaded = (video.qualitySources || []).filter(source =>
    source && source.url && (source.sourceType === 'file' || source.url.startsWith('indexeddb://'))
  ).map((source,index) => {
    const key = source.id || (String(source.label).toLowerCase() === 'hd' ? 'hd' : String(source.height || '1080'));
    const isHD = key === 'hd' || source.label === 'HD';
    return {
      id:isHD ? 'hd' : String(key), label:isHD ? 'HD' : String(key) + 'p',
      height:isHD ? 2160 : parseInt(key), rewarded:isHD || String(key) === '1080', url:source.url,
      sourceType:'file', fileId:source.fileId || source.url.slice(12)
    };
  });
  const unique = new Map();
  uploaded.forEach(q => unique.set(q.id,q));
  qualities.push(...Array.from(unique.values()).sort((a,b) => b.height - a.height));

  // YouTube and Vimeo expose player quality commands. StreamLock requests HD
  // first and 1080p second; the host uses the closest genuinely available stream.
  if (unique.size === 0 && originalUrl) {
    const media = getPlatformMedia(originalUrl,{autoplay:false,controls:false});
    if (media.platform === 'youtube' || media.platform === 'vimeo') {
      qualities.push(
        { id:'platform-hd',label:'HD',height:2160,rewarded:true,url:originalUrl,sourceType:'url',platformQuality:'highres' },
        { id:'platform-1080',label:'1080p',height:1080,rewarded:true,url:originalUrl,sourceType:'url',platformQuality:'hd1080' },
        { id:'platform-720',label:'720p',height:720,rewarded:false,url:originalUrl,sourceType:'url',platformQuality:'hd720' },
        { id:'platform-480',label:'480p',height:480,rewarded:false,url:originalUrl,sourceType:'url',platformQuality:'large' },
        { id:'platform-360',label:'360p',height:360,rewarded:false,url:originalUrl,sourceType:'url',platformQuality:'medium' }
      );
    }
  }
  return qualities;
}

function slAdIconHtml(ad, className = '') {
  if (ad && ad.iconUrl) return '<img class="sl-ad-custom-image ' + className + '" src="' + slEscapeHTML(slSafeAdLink(ad.iconUrl)) + '" alt="">';
  const icon = ad && SL_ICON_PATHS[ad.icon] ? ad.icon : 'spark';
  return '<span class="sl-ic ' + className + '">' + SLIcon(icon) + '</span>';
}

/* ============================================================
   Central ad delivery — page placements + reliable looping video
   ============================================================ */
function slEscapeHTML(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

function slSafeAdLink(value) {
  try {
    const url = new URL(value || 'https://google.com', window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
  } catch (e) { return '#'; }
}

function getBannerAdsForPlacement(settings, placement) {
  const normalized = normalizeAppData({ settings: settings || {}, links: [] });
  return normalized.settings.ads.filter(ad =>
    ad.kind === 'banner' && ad.enabled && (ad.placements || []).includes(placement)
  );
}

async function resolveAdVideoUrl(ad) {
  const raw = ad && ad.videoUrl ? ad.videoUrl : '';
  if (!raw) return '';
  if (ad.videoSourceType === 'file' || raw.startsWith('indexeddb://')) {
    const id = raw.startsWith('indexeddb://') ? raw.slice('indexeddb://'.length) : ad.id;
    return await loadVideoBlobURL(id) || '';
  }
  return raw;
}

async function renderBannerAds(container, placement, settings) {
  if (!container) return;
  const ads = getBannerAdsForPlacement(settings, placement);
  const section = container.closest('.sl-ad-section');
  if (section) section.style.display = ads.length ? '' : 'none';
  if (!ads.length) { container.innerHTML = ''; return; }

  container.innerHTML = ads.map((ad, index) => {
    const title = slStripEmoji(ad.title || ad.name || 'Sponsored offer');
    const subtitle = slStripEmoji(ad.subtitle || '');
    const button = slStripEmoji(ad.buttonText || 'Learn More');
    const color = /^#[0-9a-f]{6}$/i.test(ad.color || '') ? ad.color : '#00f2fe';
    return '<a class="sl-ad-card sl-ad-video-card" style="--ad:' + color + '" href="' + slEscapeHTML(slSafeAdLink(ad.linkUrl)) + '" target="_blank" rel="noopener sponsored">' +
      '<span class="sl-ad-media"><span class="sl-ad-media-mount" data-ad-index="' + index + '"></span><span class="sl-ad-custom-icon">' + slAdIconHtml(ad) + '</span></span>' +
      '<span class="sl-ad-tag">Sponsored Video Ad</span>' +
      '<span class="sl-ad-title">' + slEscapeHTML(title) + '</span>' +
      (subtitle ? '<span class="sl-ad-desc">' + slEscapeHTML(subtitle) + '</span>' : '') +
      '<span class="sl-ad-cta">' + slEscapeHTML(button) + '<span class="sl-ic">' + SLIcon('arrowUpRight') + '</span></span>' +
    '</a>';
  }).join('');

  ads.forEach((ad, index) => {
    const mount = container.querySelector('.sl-ad-media-mount[data-ad-index="' + index + '"]');
    mountAdaptiveMedia(mount, ad.videoUrl, {
      fileId:ad.videoUrl && ad.videoUrl.startsWith('indexeddb://') ? ad.videoUrl.slice(12) : 'ad-' + ad.id,
      autoplay:true, muted:true, loop:ad.loop !== false, controls:false, lockPlayback:true, className:'sl-ad-video'
    });
  });
  slHydrate(container);
}

function mountPageAdBanners() {
  const containers = document.querySelectorAll('[data-ad-placement]');
  if (!containers.length) return;
  const settings = getLocalData().settings;
  containers.forEach(container => renderBannerAds(container, container.dataset.adPlacement, settings));
}

/* ============================================================
   Custom vector icon library — hand-drawn, unique, no emoji.
   Every glyph is a distinct geometric mark built from code.
   ============================================================ */
const SL_ICON_PATHS = {
  menu:'<rect x="3" y="4" width="18" height="16" rx="3.2"/><path d="M9.6 4v16"/><path class="acc" d="M13.2 10h4.3M13.2 14h2.7"/><circle class="acc-fill" cx="6.3" cy="8" r="1.05"/>',
  bolt:'<path d="M12 2 20 6.5v11L12 22 4 17.5v-11L12 2Z" class="soft"/><path class="acc" d="M13.2 6.2 8.4 13h3.6l-1 4.8L15.6 11H12l1.2-4.8Z"/>',
  close:'<circle cx="12" cy="12" r="8.6"/><path class="acc" d="m9 9 6 6M15 9l-6 6"/>',
  play:'<circle cx="12" cy="12" r="8.4"/><path class="acc" d="m10.4 8.3 5.2 3.7-5.2 3.7V8.3Z"/><path class="soft" d="M3.6 7.4A8.4 8.4 0 0 1 6.2 4.6M20.4 16.6a8.4 8.4 0 0 1-2.6 2.8"/>',
  star:'<path d="M12 2.4 14 9l6.6 3-6.6 3-2 6.6-2-6.6L3.4 12 10 9l2-6.6Z"/><circle class="acc-fill" cx="19.1" cy="4.9" r="1.1"/><circle class="acc-fill" cx="5.2" cy="18.6" r=".8"/>',
  starOutline:'<path d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1.1 6.2L12 17.2l-5.5 2.9 1.1-6.2-4.5-4.4 6.2-.9L12 3Z"/>',
  user:'<circle cx="12" cy="8.2" r="3.4"/><path d="M5.2 20c.7-3.5 3.4-5.4 6.8-5.4s6.1 1.9 6.8 5.4"/><path class="acc" d="M4.4 7.6A7.6 7.6 0 0 1 8 3.2M19.6 7.6A7.6 7.6 0 0 0 16 3.2"/>',
  dashboard:'<rect x="3.4" y="3.4" width="7.1" height="7.1" rx="1.7"/><rect x="13.5" y="3.4" width="7.1" height="7.1" rx="1.7"/><rect x="3.4" y="13.5" width="7.1" height="7.1" rx="1.7"/><rect class="acc" x="13.5" y="13.5" width="7.1" height="7.1" rx="1.7"/><circle class="acc-fill" cx="17.05" cy="17.05" r="1.15"/>',
  list:'<rect x="3" y="3.6" width="18" height="4.7" rx="1.6"/><rect x="3" y="9.65" width="18" height="4.7" rx="1.6"/><rect x="3" y="15.7" width="18" height="4.7" rx="1.6"/><path class="acc" d="m6.8 5.1 2.3 1.55-2.3 1.55V5.1Zm0 6.05 2.3 1.55-2.3 1.55v-3.1Zm0 6.05 2.3 1.55-2.3 1.55v-3.1Z"/>',
  folder:'<path d="M3 7.4a2 2 0 0 1 2-2h3.8l2 2H19a2 2 0 0 1 2 2v7.9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.4Z"/><path class="acc" d="M8 12.2h8M8 15.6h5.2"/>',
  chart:'<path d="M3.6 20h16.8"/><rect x="5.2" y="12.2" width="3.2" height="6" rx="1"/><rect x="10.4" y="8.6" width="3.2" height="9.6" rx="1"/><rect class="acc" x="15.6" y="4.8" width="3.2" height="13.4" rx="1"/>',
  plus:'<circle cx="12" cy="12" r="8.4"/><path class="acc" d="M12 8.2v7.6M8.2 12h7.6"/><path class="soft" d="M18.4 5.6 20 4"/>',
  wallet:'<rect x="3" y="5.8" width="18" height="13.4" rx="2.6"/><path class="acc" d="M3 10.2h18"/><circle class="acc-fill" cx="16.4" cy="14.6" r="1.5"/>',
  gear:'<circle cx="12" cy="12" r="3.1"/><path d="M12 2.8v2.5M12 18.7v2.5M2.8 12h2.5M18.7 12h2.5M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8"/><path class="acc" d="M8.1 3.4 12 2.8l3.9.6M8.1 20.6l3.9.6 3.9-.6"/>',
  image:'<rect x="3" y="4.4" width="18" height="15.2" rx="2.6"/><circle class="acc" cx="8.4" cy="9.4" r="1.5"/><path d="m3.8 17.4 5.1-5 3.5 3.4 3.8-3.9 4 4.4"/>',
  link:'<path d="M9.4 14.6 14.6 9.4"/><path d="M7.6 11.1 6 12.7a4 4 0 0 0 5.7 5.7l1.6-1.6"/><path class="acc" d="M16.4 12.9 18 11.3A4 4 0 0 0 12.3 5.6l-1.6 1.6"/>',
  target:'<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.3"/><circle class="acc-fill" cx="12" cy="12" r="1.35"/><path class="acc" d="M12 1.8v2.8M12 19.4v2.8M1.8 12h2.8M19.4 12h2.8"/>',
  rocket:'<path d="M12 2.8c3.4 2.1 5.2 5.6 5.2 9.3L14.5 15h-5L6.8 12.1c0-3.7 1.8-7.2 5.2-9.3Z"/><circle cx="12" cy="9.2" r="1.6"/><path class="acc" d="M6.8 12.2 4.2 15l2.6 1M17.2 12.2l2.6 2.8-2.6 1M10 17.6l2 3.2 2-3.2"/>',
  game:'<path d="M7 7.8h10a4.2 4.2 0 0 1 4 5.5l-.7 2.1a2.5 2.5 0 0 1-2.4 1.7c-1 0-1.8-.5-2.9-1.6h-6c-1 1.1-1.9 1.6-2.9 1.6a2.5 2.5 0 0 1-2.4-1.7l-.7-2.1a4.2 4.2 0 0 1 4-5.5Z"/><path class="acc" d="M7.4 11v3.1M5.9 12.5h3.1"/><circle class="acc-fill" cx="16" cy="11.7" r="1"/><circle class="acc-fill" cx="18" cy="13.7" r="1"/>',
  flame:'<path d="M12 2.6c2.6 3.6 5.4 5.7 5.4 9.6a5.4 5.4 0 0 1-10.8 0c0-2.5 1.2-4.3 2.7-5.8.3 1.6 1 2.5 1.9 2.8.5-2.2-.2-4.3.8-6.6Z"/><path class="acc" d="M12 13.1c1.3 1.3 2 2.2 2 3.2a2 2 0 0 1-4 0c0-1 .7-1.9 2-3.2Z"/>',
  globe:'<circle cx="12" cy="12" r="8.4"/><path class="acc" d="M3.6 12h16.8M12 3.6c2.3 2.3 3.5 5.2 3.5 8.4s-1.2 6.1-3.5 8.4c-2.3-2.3-3.5-5.2-3.5-8.4S9.7 5.9 12 3.6Z"/>',
  crown:'<path d="M3 8.4 7 12l5-7 5 7 4-3.6-1.6 9H4.6L3 8.4Z"/><path class="acc" d="M4.6 17.4h14.8"/><circle class="acc-fill" cx="12" cy="5" r=".9"/>',
  code:'<rect x="2.6" y="4.4" width="18.8" height="15.2" rx="2.6"/><path d="M2.6 9.2h18.8"/><path class="acc" d="m8.6 12.2-2.4 2 2.4 2M15.4 12.2l2.4 2-2.4 2M13.4 11l-2.8 6.4"/><circle cx="5.5" cy="6.8" r=".7" fill="currentColor" stroke="none"/>',
  clipboard:'<rect x="5" y="4.4" width="14" height="16.2" rx="2.2"/><path d="M9 4.4V3h6v1.4"/><path class="acc" d="m8.4 12.2 2 2 4.6-4.6"/><path d="M8.4 17.2h7.2"/>',
  clock:'<circle cx="12" cy="12" r="8.4"/><path class="acc" d="M12 6.9v5.4l3.5 2.1"/>',
  alert:'<path d="M12 3.4 21 19.4H3L12 3.4Z"/><path class="acc" d="M12 9.4v4.6"/><circle class="acc-fill" cx="12" cy="16.8" r=".9"/>',
  arrowUpRight:'<path d="M6.8 17.2 17.2 6.8"/><path class="acc" d="M9 6.8h8.2V15"/>',
  arrowDown:'<path d="M12 3.4v10.4"/><path class="acc" d="m6.6 9.4 5.4 5.4 5.4-5.4"/><circle class="acc-fill" cx="12" cy="19.4" r="1"/>',
  arrowLeft:'<path d="m14 6-6 6 6 6"/><path class="acc" d="M8 12h11"/>',
  spark:'<path d="M12 2.8 13.5 9l6.2 3-6.2 3-1.5 6.2L10.5 15l-6.2-3 6.2-3L12 2.8Z"/>',
  shield:'<path d="M12 2.6 20 6v6c0 5-3.4 8.2-8 9.4-4.6-1.2-8-4.4-8-9.4V6l8-3.4Z"/><path class="acc" d="m8.5 12 2.5 2.5 4.5-5"/>',
  coin:'<circle cx="12" cy="12" r="8.4"/><path class="acc" d="M9.2 9.4h5a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h5M12 6.8v10.4"/>',
  film:'<rect x="2.8" y="5" width="18.4" height="14" rx="2.4"/><path class="acc" d="M2.8 9.2h18.4M2.8 14.8h18.4M8 5v14M16 5v14"/>',
  expand:'<path d="M8.5 3.5h-5v5M15.5 3.5h5v5M20.5 15.5v5h-5M8.5 20.5h-5v-5"/><path class="acc" d="m3.5 8.5 5-5m7 0 5 5m0 7-5 5m-7 0-5-5"/>',
  pause:'<circle cx="12" cy="12" r="8.4"/><path class="acc" d="M9.2 8v8M14.8 8v8"/>',
  volume:'<path d="M4 9.5h3.5l4.5-4v13l-4.5-4H4Z"/><path class="acc" d="M15 9a4.3 4.3 0 0 1 0 6M17.5 6.5a7.7 7.7 0 0 1 0 11"/>',
  mute:'<path d="M4 9.5h3.5l4.5-4v13l-4.5-4H4Z"/><path class="acc" d="m15.5 9 5 6m0-6-5 6"/>',
  unlock:'<rect x="4.4" y="10.4" width="15.2" height="10.2" rx="2.4"/><path class="acc" d="M8 10.4V7.6a4 4 0 0 1 7.8-1.2"/><circle class="acc-fill" cx="12" cy="15.5" r="1.3"/>'
};

function SLIcon(name){
  const body = SL_ICON_PATHS[name] || SL_ICON_PATHS.spark;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
}

/* Emoji -> custom icon map. Any emoji left anywhere in the DOM is
   swapped for one of the vector marks above, automatically. */
const SL_EMOJI_MAP = {
  '\u26A1':'bolt','\uD83D\uDCCB':'clipboard','\u2795':'plus','\uD83D\uDCCA':'chart','\uD83D\uDCB0':'wallet',
  '\u2699':'gear','\uD83D\uDDBC':'image','\uD83D\uDCC1':'folder','\uD83D\uDCC2':'folder','\uD83D\uDD17':'link',
  '\uD83C\uDFAF':'target','\uD83D\uDE80':'rocket','\uD83C\uDFAE':'game','\uD83D\uDD25':'flame',
  '\u2B50':'star','\u2605':'star','\u2606':'starOutline','\uD83D\uDC64':'user','\uD83D\uDC51':'crown',
  '\uD83C\uDF10':'globe','\uD83C\uDF0D':'globe','\u25B6':'play','\u2197':'arrowUpRight','\u2B07':'arrowDown',
  '\u23F1':'clock','\u26A0':'alert','\u25BC':'arrowDown','\u2190':'arrowLeft','\u2192':'arrowUpRight',
  '\uD83D\uDD12':'unlock','\uD83D\uDD13':'unlock','\uD83D\uDCF9':'film','\uD83D\uDEE1':'shield','\u2728':'spark'
};
const SL_EMOJI_KEYS = Object.keys(SL_EMOJI_MAP).sort((a,b) => b.length - a.length);
const SL_EMOJI_SOURCE = SL_EMOJI_KEYS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + '|\uFE0F';
const SL_EMOJI_TEST = new RegExp(SL_EMOJI_SOURCE, 'u');
const SL_EMOJI_RUN  = new RegExp(SL_EMOJI_SOURCE, 'gu');

function slStripEmoji(value){
  if (typeof value !== 'string') return value;
  return value.replace(/\uFE0F/g, '').replace(SL_EMOJI_RUN, '').replace(/[ \t]{2,}/g, ' ').trim();
}
function slDeepClean(value){
  if (typeof value === 'string') return slStripEmoji(value);
  if (Array.isArray(value)) return value.map(slDeepClean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k in value) out[k] = slDeepClean(value[k]);
    return out;
  }
  return value;
}
function slHydrate(root){
  const base = (root && root.querySelectorAll) ? root : document;
  base.querySelectorAll('[data-icon]').forEach(el => {
    if (!el.firstElementChild) el.innerHTML = SLIcon(el.getAttribute('data-icon'));
  });
}
function slCleanFields(){
  document.querySelectorAll('input, textarea').forEach(el => {
    ['value','placeholder'].forEach(k => {
      if (typeof el[k] === 'string' && SL_EMOJI_TEST.test(el[k])) el[k] = slStripEmoji(el[k]);
    });
  });
}
function slDecorate(root){
  const base = (root && root.nodeType) ? root : document.body;
  if (!base) return;
  const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      SL_EMOJI_TEST.lastIndex = 0;
      if (!SL_EMOJI_TEST.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (p.closest('script,style,textarea,select,option,title,.sl-ic,[data-sl-skip]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const hits = [];
  while (walker.nextNode()) hits.push(walker.currentNode);
  hits.forEach(node => {
    const text = node.nodeValue.replace(/\uFE0F/g, '');
    const frag = document.createDocumentFragment();
    SL_EMOJI_RUN.lastIndex = 0;
    let m, last = 0;
    while ((m = SL_EMOJI_RUN.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const key = m[0].replace(/\uFE0F/g, '');
      const span = document.createElement('span');
      span.className = 'sl-ic';
      span.setAttribute('data-icon', SL_EMOJI_MAP[key] || 'spark');
      span.innerHTML = SLIcon(SL_EMOJI_MAP[key] || 'spark');
      frag.appendChild(span);
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (frag.childNodes.length && node.parentNode) node.parentNode.replaceChild(frag, node);
  });
}
let slObserver = null, slPending = false;
function slWatchDOM(){
  if (slObserver) return;
  slObserver = new MutationObserver(() => {
    if (slPending) return;
    slPending = true;
    requestAnimationFrame(() => {
      slPending = false;
      slObserver.disconnect();
      slHydrate(document.body);
      slDecorate(document.body);
      slCleanFields();
      slObserver.observe(document.body, { childList: true, subtree: true });
    });
  });
  slObserver.observe(document.body, { childList: true, subtree: true });
}

/* ============================================================
   Global corner navigation — button + sliding drawer
   ============================================================ */
function slNavItem(href, icon, title, sub, index, isDev){
  return '<a class="sl-nav-item' + (isDev ? ' sl-dev-item' : '') + '" style="--i:' + index + '" href="' + href + '">' +
    '<span class="sl-nav-ico"><span class="sl-ic">' + SLIcon(icon) + '</span></span>' +
    '<span class="sl-nav-text"><b>' + title + '</b><small>' + sub + '</small></span>' +
    (isDev
      ? '<span class="sl-nav-tag">Developer Only</span>'
      : '<span class="sl-nav-arrow"><span class="sl-ic">' + SLIcon('arrowUpRight') + '</span></span>') +
    '</a>';
}

function slGlobalAuthAction() {
  if (getCurrentSession()) { clearSession(); location.href = 'login.html'; }
  else location.href = 'login.html';
}

function injectGlobalNav(){
  if (document.getElementById('sl-topbar')) return;
  const isDev = isDeveloperAccount();
  const signedIn = !!getCurrentSession();
  const file = (location.pathname.split('/').pop() || 'index.html').replace('.html','') || 'index';
  const names = {
    'index':'Developer Console','admin':'Developer Dashboard','groups':'Video Lists',
    'watch':'Watcher','browse':'Browse Video Lists','list':'Video List','profile':'Video Lounge','login':'Sign In'
  };
  const pageName = names[file] || 'StreamLock';

  const host = document.createElement('div');
  host.id = 'sl-nav-root';
  host.innerHTML =
    '<div class="sl-topbar" id="sl-topbar">' +
      '<button class="sl-menu-btn" id="sl-menu-btn" onclick="toggleSiteMenu()" aria-label="Open site menu" title="Open site menu">' +
        '<span class="sl-ic" data-sl-skip>' + SLIcon('menu') + '</span>' +
      '</button>' +
      '<span class="sl-menu-label">Menu</span>' +
      '<div class="sl-wordmark"><span class="sl-ic" data-sl-skip>' + SLIcon('bolt') + '</span> Stream<em>Lock</em></div>' +
      '<div class="sl-topbar-right"><span class="sl-page-chip">' + pageName + '</span><button type="button" class="sl-auth-button" onclick="slGlobalAuthAction()"><span class="sl-ic">' + SLIcon('user') + '</span><span>' + (signedIn ? 'Sign Out' : 'Sign In') + '</span></button></div>' +
    '</div>' +
    '<div class="sl-scrim" id="sl-scrim" onclick="closeSiteMenu()"></div>' +
    '<aside class="sl-drawer" id="sl-drawer" aria-hidden="true">' +
      '<div class="sl-drawer-head">' +
        '<div class="sl-drawer-brand">' +
          '<span class="sl-drawer-mark"><span class="sl-ic" data-sl-skip>' + SLIcon('bolt') + '</span></span>' +
          '<div><strong>StreamLock</strong><small>Pages</small></div>' +
        '</div>' +
        '<button class="sl-close" onclick="closeSiteMenu()" aria-label="Close menu" title="Close"><span class="sl-ic" data-sl-skip>' + SLIcon('close') + '</span></button>' +
      '</div>' +
      '<div class="sl-drawer-body">' +
        '<div class="sl-group-label">Public Pages</div>' +
        slNavItem('browse.html','list','Browse','Search and explore all video lists',0,false) +
        slNavItem('browse.html?favorites=1','star','My Favorite Video Lists','Open your saved video lists',1,false) +
        slNavItem('login.html','user','Sign In / Account','Access your member profile',2,false) +
        (isDev
          ? '<div class="sl-group-label sl-dev"><span class="sl-ic" data-sl-skip>' + SLIcon('code') + '</span> Developer (Exclusive Access)</div>' +
            slNavItem('index.html','dashboard','Developer Console','Videos, ads, analytics',3,true)
          : '') +
      '</div>' +
      '<div class="sl-drawer-foot"><span class="sl-ic" data-sl-skip>' + SLIcon('spark') + '</span> StreamLock · crafted for smooth viewing</div>' +
    '</aside>';
  document.body.insertBefore(host, document.body.firstChild);
}

function openSiteMenu(){
  document.body.classList.add('sl-menu-open');
  const d = document.getElementById('sl-drawer');
  if (d) d.setAttribute('aria-hidden','false');
}
function closeSiteMenu(){
  document.body.classList.remove('sl-menu-open');
  const d = document.getElementById('sl-drawer');
  if (d) d.setAttribute('aria-hidden','true');
}
function toggleSiteMenu(){
  document.body.classList.contains('sl-menu-open') ? closeSiteMenu() : openSiteMenu();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSiteMenu(); });
document.addEventListener('DOMContentLoaded', () => {
  injectGlobalNav();
  mountPageAdBanners();
  hydrateIndexedImages(document.body);
  slHydrate(document.body);
  slDecorate(document.body);
  slCleanFields();
  if (typeof document.title === 'string') document.title = slStripEmoji(document.title);
  slWatchDOM();
});

if (typeof window !== "undefined") window.alert = slAlert;
