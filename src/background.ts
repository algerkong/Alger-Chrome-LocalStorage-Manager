chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'alger-quick-view',
    title: 'Quick View Storage',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: 'alger-full-manager',
    title: 'Full Storage Manager',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (info.menuItemId === 'alger-quick-view') {
    chrome.windows.create({
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width: 800,
      height: 600,
    });
  } else if (info.menuItemId === 'alger-full-manager') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('index.html?mode=fullpage'),
    });
  }
});
