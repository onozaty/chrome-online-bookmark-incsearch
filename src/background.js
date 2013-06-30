chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({ url: 'view.html', selected: true });
});
