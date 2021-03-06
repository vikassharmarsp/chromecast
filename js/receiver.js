const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();
let iteration = 1;
let interval = 120000;
let playlistData;

//Media Sample API Values
// const SAMPLE_URL = "https://storage.googleapis.com/cpe-sample-media/content.json";
const SAMPLE_URL = "https://api.blackdove.io/users/anonymous/playlists/Y0d4aGVXeHBjM1E9NzlmMzdkNzAtYTlmZC0xMWU3LWI5ZDMtNTU2OGIzMzVhMDUx";
const StreamType = {
  DASH: 'application/dash+xml',
  HLS: 'application/x-mpegurl'
}
const TEST_STREAM_TYPE = StreamType.DASH

// Debug Logger
const castDebugLogger = cast.debug.CastDebugLogger.getInstance();
const LOG_TAG = 'MyAPP.LOG';

// Enable debug logger and show a 'DEBUG MODE' overlay at top left corner.
castDebugLogger.setEnabled(true);

// Show debug overlay
// castDebugLogger.showDebugLogs(true);

// Set verbosity level for Core events.
castDebugLogger.loggerLevelByEvents = {
  'cast.framework.events.category.CORE': cast.framework.LoggerLevel.INFO,
  'cast.framework.events.EventType.MEDIA_STATUS': cast.framework.LoggerLevel.DEBUG
}

// Set verbosity level for custom tags.
castDebugLogger.loggerLevelByTags = {
    LOG_TAG: cast.framework.LoggerLevel.DEBUG,
};

function makeRequest (method, url) {
  console.log("URL : ", url);
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoidGVzdGVyM0BibGFja2RvdmUuY28iLCJpYXQiOjE2MjIwOTc5NDcsImV4cCI6MTYyMjE4NDM0NywianRpIjoiYWNjZXNzX3Rva2VuIn0.WWF9iG2BLXGqzN_eLwH4adbtL0Y6AKc1cMYBFFRfUdw');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

playerManager.addEventListener(
    cast.framework.events.EventType.MEDIA_STATUS, (event) => {
      console.log("Media Event : ", event);
});

playerManager.setMessageInterceptor(
  cast.framework.messages.MessageType.LOAD,
  request => {
    castDebugLogger.info(LOG_TAG, 'Intercepting LOAD request');

    // Map contentId to entity
    console.log("Request : ", request);
    if (request.media && request.media.entity) {
      request.media.contentId = request.media.entity;
    }

    return new Promise((resolve, reject) => {
      // Fetch repository metadata
      makeRequest('GET', SAMPLE_URL)
        .then(function (data) {
          console.log("Data : ", data);
          playlistData = data;
          // Obtain resources by contentId from downloaded repository metadata.
          // let item = data[request.media.contentId];
          let item = playlistData.artworks.length;
          if(item < 0) {
            // Content could not be found in repository
            castDebugLogger.error(LOG_TAG, 'Content not found');
            reject();
          } else {
            // Adjusting request to make requested content playable
            // request.media.contentType = TEST_STREAM_TYPE;

            // // Configure player to parse DASH content
            // if(TEST_STREAM_TYPE == StreamType.DASH) {
              request.media.contentUrl = playlistData.artworks[iteration].media.video.dash;
              iteration = iteration + 1;
              setInterval(() => {
                request.media.contentUrl = playlistData.artworks[iteration].media.video.dash;
                if(iteration < playlistData.artworks.length) iteration = iteration + 1;              
                else iteration = 0;
              }, interval);
            // }

            // // Configure player to parse HLS content
            // else if(TEST_STREAM_TYPE == StreamType.HLS) {
            //   request.media.contentUrl = item.stream.hls
            //   request.media.hlsSegmentFormat = cast.framework.messages.HlsSegmentFormat.FMP4;
            //   request.media.hlsVideoSegmentFormat = cast.framework.messages.HlsVideoSegmentFormat.FMP4;
            // }
            
            castDebugLogger.warn(LOG_TAG, 'Playable URL:', playlistData.artworks[iteration].media.video.dash);
            
            // Add metadata
            let metadata = new cast.framework.messages.GenericMediaMetadata();
            // metadata.title = "Blackdove Featured Collection";
            // metadata.subtitle = "App by Vikas Sharma";
            metadata.title = playlistData.artworks[iteration].name;
            metadata.subtitle = playlistData.artworks[iteration]._embedded.artist.givenName + " " + playlistData.artworks[iteration]._embedded.artist.surname;

            request.media.metadata = metadata;

            // Resolve request
            resolve(request);
          }
      });
    });
  });

// Optimizing for smart displays
const touchControls = cast.framework.ui.Controls.getInstance();
const playerData = new cast.framework.ui.PlayerData();
const playerDataBinder = new cast.framework.ui.PlayerDataBinder(playerData);

// let browseItems = getBrowseItems();

// function getBrowseItems() {
//   let browseItems = [];
//   makeRequest('GET', SAMPLE_URL)
//   .then(function (data) {
//     for (let key in data) {
//       let item = new cast.framework.ui.BrowseItem();
//       item.entity = key;
//       item.title = data[key].title;
//       item.subtitle = data[key].description;
//       item.image = new cast.framework.messages.Image(data[key].poster);
//       item.imageType = cast.framework.ui.BrowseImageType.MOVIE;
//       browseItems.push(item);
//     }
//   });
//   return browseItems;
// }

// let browseContent = new cast.framework.ui.BrowseContent();
// browseContent.title = 'Up Next';
// browseContent.items = browseItems;
// browseContent.targetAspectRatio =
//   cast.framework.ui.BrowseImageAspectRatio.LANDSCAPE_16_TO_9;

// playerDataBinder.addEventListener(
//   cast.framework.ui.PlayerDataEventType.MEDIA_CHANGED,
//   (e) => {
//     if (!e.value) return;

//     // Media browse
//     // touchControls.setBrowseContent(browseContent);

//     // Clear default buttons and re-assign
//     touchControls.clearDefaultSlotAssignments();
//     touchControls.assignButton(
//       cast.framework.ui.ControlsSlot.SLOT_PRIMARY_1,
//       cast.framework.ui.ControlsButton.SEEK_BACKWARD_30
//     );
//   });

context.start();
