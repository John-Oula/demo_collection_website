// ################################################
// Record demonstrations

/* POST submit format

* utterance
* states: array of objects with the following keys:
  - time: time elapsed since start of video
  - dom: DOM structure
  - action: action performed at that moment
  -link to screenshot
  - current brwoser view port coordinates
  -screen width
  -screen height
* reward

*/

var recorder = {
  isTakingScreenshot: false,
};

// Add event listeners
recorder.LISTENERS = [
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'keypress',
  'keydown',
  'keyup',
  'scroll',
];

//Takes a screenshot
//uses a boolean to make sure no other screenshot can occur while a screenshot is happening
recorder.takeScreenshot = function(screenshotFileName) {
  if (recorder.isTakingScreenshot) return;
  recorder.isTakingScreenshot = true;

  html2canvas(document.body).then(canvas => {
      // var image = canvas.toDataURL("image/png");
      var image = canvas.toDataURL();
      var link = document.createElement('a');
      link.href = image;
      link.download = screenshotFileName + '.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      recorder.canTakeScreenshot = true;
      // Pass the screenshot data to the sendScreenshotToServer function
      recorder.screenshots.push({fileName: screenshotFileName, data: image});
      // recorder.sendScreenshotToServer(image,screenshotFileName);
      console.log("screenshot added to queue")
      console.log(recorder.screenshots)
  });
};

//set up the recorder and set the listeners for events on for the recording
recorder.setup = function () {
  if (recorder.isSetup) return;

  // Set up event listeners
  recorder.LISTENERS.forEach(function (name) {
    document.addEventListener(name, recorder['on' + name], true);
    document.addEventListener(name, recorder['on' + name], false);
  });

  // Set the task name based on the current URL
  var url = window.location.pathname;
  recorder.taskName = url.substr(url.lastIndexOf('/') + 1).replace(/\.html/, '');

  recorder.isSetup = true;
}

// Start recording the episode
recorder.startRecording = function () {
  // Initialise the data
  recorder.data = {};
  recorder.screenshots = [];
  // Get all the relevant data for start of episode: taskname,screen width,screen height,starting dom
  recorder.data.taskName = recorder.taskName;
  recorder.data.screen_width = window.screen.width;
  recorder.data.screen_height = window.screen.height;
  //take the screenshot at the start of the episode
  console.log("taking screenshot")
  var screenshotFileName = 'click_' + Date.now();
  recorder.takeScreenshot(screenshotFileName);
  recorder.data.startscreenshot = screenshotFileName
  console.log("screenshot file name",recorder.data.startscreenshot)
  recorder.data.startDom = core.getDOMInfo();
  // Get utterance
  var utterance = core.getUtterance();
  if (typeof utterance === 'string') {
    recorder.data.utterance = utterance;
  } else {
    recorder.data.utterance = utterance.utterance;
    recorder.data.fields = utterance.fields;
  }
  recorder.data.states = [];
  recorder.isRecording = true;
  recorder.addState(null, null);
}

recorder.addState = function(event, action) {
  if (!recorder.isRecording) return;
  if (event && action) action.timing = event.eventPhase;

  // Initialize state with a placeholder for the screenshot
  var state = {
    'time': new Date().getTime() - core.ept0,
    'action': action,
    'screenshot': 'pending', // Placeholder
    'browserPosition': { 'x': window.screenX, 'y': window.screenY }
  };
  if (event) event.target.dataset.recording_target = true;
  state.dom = core.getDOMInfo();
  if (event) delete event.target.dataset.recording_target;

  // Add the state with the placeholder
  recorder.data.states.push(state);
  console.log('Action:', state.action);

  // If action type is 'click', delay the screenshot capture
  // If action type is 'click', delay the screenshot capture
if (action && action.type === 'click') {
  // Introduce a delay before taking the screenshot
  setTimeout(function() {
      console.log("taking screenshot");
      var screenshotFileName = 'click_' + Date.now();
      recorder.takeScreenshot(screenshotFileName);
      console.log("screenshot file name", screenshotFileName);

      // Update the last state object with the screenshot link
      console.log("length of states", recorder.data.states.length);
      if (recorder.data && Array.isArray(recorder.data.states) && recorder.data.states.length) {
          recorder.data.states[recorder.data.states.length - 1].screenshot = screenshotFileName + '.png';
      }
  }, 300); // Delay of 300 ms (adjust as needed)
}

};

// Actions
recorder.ondblclick = function (event) {
  if (event.target === core.cover_div ||
      event.pageX >= 160 || event.pageY >= 210)
    return;
  recorder.addState(event, {
    'type': 'dblclick',
    'x': event.pageX,
    'y': event.pageY,
  });
}
recorder.onclick = function (event) {
  if (event.target === core.cover_div ||
      event.pageX >= 160 || event.pageY >= 210)
    return;
  recorder.addState(event, {
    'type': 'click',
    'x': event.pageX,
    'y': event.pageY,
  });
}


recorder.onmousedown = function (event) {
  if (event.target === core.cover_div ||
      event.pageX >= 160 || event.pageY >= 210)
    return;
  recorder.addState(event, {
    'type': 'mousedown',
    'x': event.pageX,
    'y': event.pageY,
  });
}
recorder.onmouseup = function (event) {
  if (event.target === core.cover_div ||
      event.pageX >= 160 || event.pageY >= 210)
    return;
  recorder.addState(event, {
    'type': 'mouseup',
    'x': event.pageX,
    'y': event.pageY,
  });
}

recorder.onkeypress = function (event) {
  recorder.addState(event, {
    'type': 'keypress',
    'keyCode': event.keyCode,
    'charCode': event.charCode,
  });
}
recorder.onkeydown = function (event) {
  recorder.addState(event, {
    'type': 'keydown',
    'keyCode': event.keyCode,
    'charCode': event.charCode,
  });
}
recorder.onkeyup = function (event) {
  recorder.addState(event, {
    'type': 'keyup',
    'keyCode': event.keyCode,
    'charCode': event.charCode,
  });
}

recorder.onscroll = function (event) {
  // Scroll is super redundant; only keep the first one
  if (recorder.data.states.length) {
    var lastState = recorder.data.states[recorder.data.states.length - 1];
    if (lastState.action && lastState.action.type === 'scroll')
      return;
      //recorder.data.states.pop();     // <-- use this for keeping the last one
  }
  recorder.addState(event, {
    'type': 'scroll',
  });
}

// End recording the episode
// recorder.endRecording = function () {
//   recorder.data.reward = WOB_REWARD_GLOBAL;
//   recorder.data.rawReward = WOB_RAW_REWARD_GLOBAL;
//   // Send the data to the server
//   recorder.isRecording = false;
//   var data = recorder.data;
//   recorder.data = {};   // Prevent future addition
//   console.log(data);
//   var req = new XMLHttpRequest();
//   req.open('POST', recorder.server);
//   req.setRequestHeader('Content-type', 'text/plain');
//   req.onreadystatechange = function () {
//     if (req.readyState === XMLHttpRequest.DONE) {
//       var msg = document.getElementById('server-reply');
//       if (req.status === 200) {
//         msg.setAttribute('style', 'color:green');
//         msg.textContent = 'OK: ' + req.responseText;
//       } else {
//         msg.setAttribute('style', 'color:red');
//         msg.textContent = 'ERROR: ' + req.statusText;
//       }
//     }
//   }
//   req.send(JSON.stringify(data));
//   // Make it ready for the next episode
//   core.cover_div.classList.remove('transparent');
// }

recorder.endRecording = function () {
  recorder.data.reward = WOB_REWARD_GLOBAL;
  recorder.data.rawReward = WOB_RAW_REWARD_GLOBAL;

  // Convert the recorded data to a JSON string
  var jsonData = JSON.stringify(recorder.data, null, 2); // Beautify the JSON

  // Create a Blob from the JSON data
  var dataBlob = new Blob([jsonData], {type : 'application/json'});

  // Create an object URL for the Blob
  var url = window.URL.createObjectURL(dataBlob);

  // Create a temporary anchor element and trigger download
  var tempLink = document.createElement('a');
  tempLink.href = url;
  tempLink.download = recorder.taskName + '_data.json'; // Name of the downloaded file
  tempLink.style.display = 'none';
  document.body.appendChild(tempLink); // Required for Firefox
  tempLink.click(); // Trigger the download

  // Cleanup
  document.body.removeChild(tempLink);
  window.URL.revokeObjectURL(url);

  // Reset recorder state
  recorder.isRecording = false;
  recorder.data = {};

  // Remove event listeners
  recorder.LISTENERS.forEach(function (name) {
    console.log("removing event listeners")
    document.removeEventListener(name, recorder['on' + name], true);
    document.removeEventListener(name, recorder['on' + name], false);
  });
  console.log("remove event listeners")
  // recorder.sendScreenshotsToServer(recorder.screenshots)
  setTimeout(function() {
    recorder.sendScreenshotsToServer(recorder.screenshots);
  }, 10); // 10 seconds delay
  // Send JSON data to the server
  debugger; // Pause the execution here to inspect the current state
  recorder.sendJsonToServer(jsonData);
  debugger; // Pause the execution here to inspect the current state
}

// recorder.sendScreenshotToServer = function(screenshotData, screenshotFileName) {
//   console.log("Sending screenshot to server");

//   $.ajax({
//     type: "POST",
//     url: "http://localhost:5000/hook",
//     data: {
//       imageBase64: screenshotData,
//       imageName: screenshotFileName
//     },
//     xhrFields: {
//       withCredentials: true
//     },
//     crossDomain: true
//   }).done(function(response) {
//     console.log('Screenshot sent successfully:', response);
//   }).fail(function(jqXHR, textStatus) {
//     console.log('Failed to send screenshot:', textStatus);
//   });
// }

recorder.sendScreenshotsToServer = function(screenshots) {
  console.log("Sending screenshots to server");
  console.log("screenshots array",screenshots)

  // Iterate through each screenshot in the array
  screenshots.forEach(function(screenshot, index) {
    // Delay the execution for each screenshot
    setTimeout(function() {
      $.ajax({
        type: "POST",
        url: "http://localhost:5000/hook",
        data: {
          imageBase64: screenshot.data,
          imageName: screenshot.fileName
        },
        xhrFields: {
          withCredentials: true
        },
        crossDomain: true
      }).done(function(response) {
        console.log('Screenshot sent successfully:', response);
      }).fail(function(jqXHR, textStatus) {
        console.log('Failed to send screenshot:', textStatus);
      });
    }, 1000 * index); // Delay of 1 second per screenshot
  });
}

recorder.sendJsonToServer = function(jsonData) {
  console.log("Sending JSON data to server");

  $.ajax({
    type: "POST",
    url: "http://localhost:5000/upload_json",
    data: jsonData,
    contentType: "application/json", // Specify that you're sending JSON
    dataType: "json", // Expect a JSON response
    xhrFields: {
      withCredentials: true
    },
    crossDomain: true,
  }).done(function(response) {
    console.log('JSON data sent successfully:', response);
  }).fail(function(jqXHR, textStatus) {
    console.log('Failed to send JSON data:', textStatus);
  });
}








