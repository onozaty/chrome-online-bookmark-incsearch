async function startup() {
  const settings = (await Storage.get('settings')) || {numberOfPage: 10};
  let bookmarks = await Storage.get('bookmarks');

  if (!settings.serviceId) {
    // Select service
    settings.serviceId = ServiceId.PINBOARD;
  }

  const service = Services.filter((service) => service.id == settings.serviceId)[0].service;

  if (!bookmarks) {
    bookmarks = await service.newLoader().load();
    await Storage.set({bookmarks: bookmarks});
  }

  const searchableTable = new SearchableTable(
    bookmarks,
    settings.numberOfPage,
    service,
    {
      $document: $(document),
      $query: $('#query'),
      $resultTable: $('#resultTable'),
      $status: $('#status'),
      $pagerPrev: $('button.pager-prev'),
      $pagerNext: $('button.pager-next')
    });
}

startup();