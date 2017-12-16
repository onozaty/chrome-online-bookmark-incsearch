async function loadBookmarks(service) {

  const $loadingDialog = $('#loadingDialog');
  const $loadingMessage = $('#loadingMessage');
  const $progressBar = $loadingDialog.find('.progress-bar');
  const $closeButton = $loadingDialog.find('.modal-footer button');

  $loadingMessage.text('Loading...');
  $progressBar.addClass('active').css('width', '0%');
  $closeButton.prop('disabled', true);

  $loadingDialog.modal({
    backdrop: 'static'
  });

  let bookmarks = [];
  try {
    $progressBar.css('width', '30%');
    bookmarks = await service.newLoader().load();
    $progressBar.css('width', '100%');

    await Storage.set({bookmarks: bookmarks});

    $loadingMessage.text(`${format(bookmarks.length)} bookmarks loading is Completed.`);
  } catch (e) {
    $loadingMessage.text(`Bookmarks loading is failed. message: ${e}`);
  }

  $progressBar.removeClass('active');
  $closeButton.prop('disabled', false);

  return bookmarks;
}

async function startup() {

  // Setting dialog
  const $inputNumberOfRowsPerPage = $('#inputNumberOfRowsPerPage');
  const $selectService = $('#selectService');

  $('#buttonSync').on('click', async () => {
    bookmarks = await loadBookmarks(service);

    searchableTable.refresh(
      bookmarks,
      settings.numberOfRowsPerPage,
      service);
  });

  $('#buttonOpenSetting').on('click', () => {
    $inputNumberOfRowsPerPage.val(settings.numberOfRowsPerPage);
    $selectService.val(settings.serviceId);

    $('#settingDialog').modal({
      backdrop: 'static'
    });
  });

  $('#buttonSaveSetting').on('click', async () => {
    $('#settingDialog').modal('hide');

    settings.numberOfRowsPerPage = parseInt($inputNumberOfRowsPerPage.val());
    settings.serviceId = $selectService.val();
    await Storage.set({settings: settings});

    const beforeService = service;
    service = Services.filter((service) => service.id == settings.serviceId)[0].service;
    if (beforeService != service) {
      bookmarks = await loadBookmarks(service);
    }

    searchableTable.refresh(
      bookmarks,
      settings.numberOfRowsPerPage,
      service);
  });

  $selectService.empty();
  Services.forEach((service) => {
    $option = $('<option>').val(service.id).text(service.name);
    $selectService.append($option);
  });

  let settings = (await Storage.get('settings')) || {numberOfRowsPerPage: 10};
  let bookmarks = (await Storage.get('bookmarks')) || (await loadBookmarks(service));

  if (!settings.serviceId) {
    // Select service
    settings.serviceId = ServiceId.PINBOARD;
  }

  let service = Services.filter((service) => service.id == settings.serviceId)[0].service;

  const searchableTable = new SearchableTable(
    bookmarks,
    settings.numberOfRowsPerPage,
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