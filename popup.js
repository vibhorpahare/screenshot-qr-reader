const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const result = document.getElementById('result');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

let currentTabId = null;

function historyKey(tabId) {
  return `hist_${tabId}`;
}

async function loadHistory(tabId) {
  const key = historyKey(tabId);
  const data = await chrome.storage.session.get(key);
  return data[key] || [];
}

async function saveHistory(tabId, history) {
  await chrome.storage.session.set({ [historyKey(tabId)]: history });
}

function renderHistory(history) {
  historyList.innerHTML = '';
  historySection.style.display = history.length ? 'block' : 'none';

  // newest first
  [...history].reverse().forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'histItem';

    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.src = entry.thumb;
    item.appendChild(thumb);

    const body = document.createElement('div');
    body.className = 'body';

    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = entry.text;
    text.title = entry.text;
    body.appendChild(text);

    const time = document.createElement('div');
    time.className = 'time';
    time.textContent = new Date(entry.time).toLocaleTimeString();
    body.appendChild(time);

    item.appendChild(body);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const isLink = /^https?:\/\//i.test(entry.text);
    const btn = document.createElement('button');
    if (isLink) {
      btn.textContent = 'Open';
      btn.onclick = () => chrome.tabs.create({ url: entry.text });
    } else {
      btn.className = 'secondary';
      btn.textContent = 'Copy';
      btn.onclick = () => navigator.clipboard.writeText(entry.text);
    }
    actions.appendChild(btn);

    item.appendChild(actions);
    historyList.appendChild(item);
  });
}

function makeThumbnail(img) {
  const t = document.createElement('canvas');
  t.width = 80;
  t.height = 80;
  const tctx = t.getContext('2d');
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  tctx.drawImage(img, sx, sy, side, side, 0, 0, 80, 80);
  return t.toDataURL('image/jpeg', 0.7);
}

async function addToHistory(text, thumb) {
  if (currentTabId == null) return;
  const history = await loadHistory(currentTabId);
  // skip consecutive duplicate
  if (history.length && history[history.length - 1].text === text) return;
  history.push({ text, thumb, time: Date.now() });
  await saveHistory(currentTabId, history);
  renderHistory(history);
}

function showResult(text, isError) {
  result.style.display = 'block';
  result.classList.toggle('error', !!isError);

  if (isError) {
    result.textContent = text;
    return;
  }

  const isLink = /^https?:\/\//i.test(text);
  result.innerHTML = '';

  const label = document.createElement('div');
  label.textContent = 'Decoded:';
  result.appendChild(label);

  const box = document.createElement('div');
  box.id = 'linkBox';
  box.textContent = text;
  result.appendChild(box);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const btn = document.createElement('button');
  if (isLink) {
    btn.textContent = 'Open';
    btn.onclick = () => chrome.tabs.create({ url: text });
  } else {
    btn.className = 'secondary';
    btn.textContent = 'Copy';
    btn.onclick = () => navigator.clipboard.writeText(text);
  }
  actions.appendChild(btn);

  result.appendChild(actions);
}

function decodeImage(img) {
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (code) {
    showResult(code.data, false);
    addToHistory(code.data, makeThumbnail(img));
  } else {
    showResult('No QR code found in that image. Try a tighter crop.', true);
  }
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      decodeImage(img);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => loadFile(e.target.files[0]));

['dragenter', 'dragover'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag');
  })
);

['dragleave', 'drop'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag');
  })
);

dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  loadFile(file);
});

document.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      loadFile(item.getAsFile());
      break;
    }
  }
});

clearHistoryBtn.addEventListener('click', async () => {
  if (currentTabId == null) return;
  await saveHistory(currentTabId, []);
  renderHistory([]);
});

(async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;
  const history = await loadHistory(currentTabId);
  renderHistory(history);
})();
