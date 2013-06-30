var DEFAULT_NUMBER_OF_RESULTS = 10;
var DEFAULT_SIZE_OF_INPUT_AREA = 80;

var incsearch = null;
var database = null;

window.addEventListener('load', function(){
  var text = document.getElementById('text');
  var viewArea = document.getElementById('viewArea');
  var status = document.getElementById('status');
  var sync = document.getElementById('sync');
  var setting = document.getElementById('setting');
  var help = document.getElementById('help');
  var loadingBox = document.getElementById('loadingBox');
  var loadingImage = document.getElementById('loadingImage');
  var loadingMessage = document.getElementById('loadingMessage');
  var pageLinkTop = document.getElementById('pageLinkTop');
  var pageLinkBottom = document.getElementById('pageLinkBottom');

  database = new Database(
                     "bookmarks", "1.0", "Online Bookmark IncSearch", 1024 * 1024,
                     function(error) {
                       status.innerHTML = error.message || error;
                       loadingBox.style.display = 'none';
                       Glayer.hide();
                     });

  var userId = localStorage.userId;
  var numberOfResults = parseInt(localStorage.numberOfResults || DEFAULT_NUMBER_OF_RESULTS);
  var sizeOfInputArea = parseInt(localStorage.sizeOfInputArea || DEFAULT_SIZE_OF_INPUT_AREA);
  var useBookmarkService = localStorage.useBookmarkService;

  text.size = sizeOfInputArea;

  var initIncSearch = function() {

    // global
    incsearch = new IncSearch(
                      text,
                      viewArea,
                      {
                        dispMax: numberOfResults,
                        status: status,
                        pageLinkTop: pageLinkTop,
                        pageLinkBottom: pageLinkBottom,
                        database: database,
                        userId: userId
                      }
                    );
    incsearch.input.focus();

    var update = function() {
      incsearch.input.focus();
      new BookmarkLoader(loadingBox, loadingMessage, database);
    };

    sync.addEventListener('click', update, false);

    // settings
    var settingBox = document.getElementById('settingBox');
    var settingSave = document.getElementById('settingSave');
    var settingCancel = document.getElementById('settingCancel');
    var useBookmarkServiceElement = document.getElementById('useBookmarkService');
    var numberOfResultElement = document.getElementById('numberOfResults');
    var sizeOfInputAreaElement = document.getElementById('sizeOfInputArea');

    var openSetting = function() {
      Glayer.showBox(settingBox);
      useBookmarkServiceElement.value = useBookmarkService;
      numberOfResultElement.value = incsearch.dispMax;
      numberOfResultElement.focus();
      sizeOfInputAreaElement.value = text.size;
    };

    var closeSetting = function() {
      Glayer.hideBox(settingBox);
      incsearch.input.focus();
    };

    setting.addEventListener('click', openSetting, false);

    numberOfResultElement.addEventListener(
      'keydown',
      function(event) {
        if (event.keyCode == 13) {
          settingSave.click();
        }
      },
      false);

    sizeOfInputAreaElement.addEventListener(
      'keydown',
      function(event) {
        if (event.keyCode == 13) {
          settingSave.click();
        }
      },
      false);

    settingSave.addEventListener(
      'click',
      function() {
        Glayer.hideBox(settingBox);
        incsearch.dispMax = parseInt(numberOfResultElement.value) || incsearch.dispMax;
        localStorage.numberOfResults = incsearch.dispMax;
        incsearch.input.size = parseInt(sizeOfInputAreaElement.value) || incsearch.input.size;
        localStorage.sizeOfInputArea = incsearch.input.size;

        if (useBookmarkService != useBookmarkServiceElement.value) {
          changeBookmarkService(useBookmarkServiceElement.value);
        }

        incsearch.reset();
        incsearch.input.focus();
      },
      false);

    settingCancel.addEventListener('click', closeSetting, false);

    // help
    var helpBox = document.getElementById('helpBox');
    var helpClose = document.getElementById('helpClose');

    var openHelp = function() {
      Glayer.showBox(helpBox);
      helpClose.focus();
    };

    var closeHelp = function() {
      Glayer.hideBox(helpBox);
      incsearch.input.focus();
    };

    var hideMsgBox = function() {
      helpBox.style.display = 'none';
      settingBox.style.display = 'none';
      loadingBox.style.display = 'none';

      var confirmBox = document.getElementById('glayer_confirm');
      if (confirmBox) {
        confirmBox.style.display = 'none';
      }
      var alertBox = document.getElementById('glayer_alert');
      if (alertBox) {
        alertBox.style.display = 'none';
      }
    }

    help.addEventListener('click', openHelp, false);
    helpClose.addEventListener('click', closeHelp, false);

    // shortcut
    document.addEventListener(
      'keydown',
      function(event) {
        if (event.ctrlKey) {
          switch(event.keyCode) {
            case 85:  // u (Sync)
              hideMsgBox();
              update();
              IncSearch._stopEvent(event);
              break;
            case 83:  // s (Setting)
              if (settingBox.style.display == '') {
                closeSetting();
              } else {
                hideMsgBox();
                openSetting();
              }
              IncSearch._stopEvent(event);
              break;
            case 191:  // / (Help)
              if (helpBox.style.display == '') {
                closeHelp();
              } else {
                hideMsgBox();
                openHelp();
              }
              IncSearch._stopEvent(event);
              break;
            default:
              break;
          }
        }
      },
      false);

    // select bookmark service
    var selectBookmarkServiceBox = document.getElementById('selectBookmarkServiceBox');
    var bookmarkServiceForm = document.getElementById('bookmarkServiceForm');
    var selectBookmarkServiceStartButton = document.getElementById('selectBookmarkServiceStart');

    var startSelectBookmarkService = function() {
      Glayer.hideBox(selectBookmarkServiceBox);

      var bookmarkSericeName = null;
      for (var i = 0, len = bookmarkServiceForm.bookmarkService.length; i < len; i++) {
        if (bookmarkServiceForm.bookmarkService[i].checked) {
          bookmarkServiceName = bookmarkServiceForm.bookmarkService[i].value;
        }
      }
      changeBookmarkService(bookmarkServiceName);
    };

    selectBookmarkServiceStartButton.addEventListener('click', startSelectBookmarkService, false);

    var setupBookmarkService = function() {

      switch(useBookmarkService) {
        case "delicious":
          BookmarkLoader = DeliciousLoader;
          break;
        case "google":
          BookmarkLoader = GoogleBookmarksLoader;
          break;
        case "pinboard":
          BookmarkLoader = PinboardLoader;
          break;
        case "hatena":
          BookmarkLoader = HatenaBookmarkLoader;
          break;
        case "livedoor":
          BookmarkLoader = LivedoorClipLoader;
          break;
      }

      IncSearch.prototype.createEditUrl = BookmarkLoader.createEditUrl;
    }

    var changeBookmarkService = function(bookmarkSericeName) {
      delete localStorage.userId;
      localStorage.useBookmarkService = bookmarkSericeName;
      useBookmarkService = bookmarkSericeName;
      setupBookmarkService();

      database.transaction({
        sql: "DELETE FROM bookmark"
      }).
      success(function() {
        incsearch.reset();
        update();
      }).
      start();
    }

    if (!userId || !useBookmarkService) {
      Glayer.showBox(selectBookmarkServiceBox);
    } else {
      setupBookmarkService();
    }
  }

  if (!userId || !useBookmarkService) {
    database.transaction({
      sql: "DROP TABLE IF EXISTS bookmark"
    }).
    next({
      sql: "CREATE TABLE bookmark(id INTEGER, url TEXT, title TEXT, info TEXT, tags TEXT, time TEXT, search_text TEXT, PRIMARY KEY(id))"
    }).
    success(initIncSearch).
    start();
  } else {
    initIncSearch();
  }

}, false);

var BookmarkLoader = null;
