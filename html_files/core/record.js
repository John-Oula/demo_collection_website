// ################################################
// Record demonstrations

/* POST submit format

* utterance
* states: array of objects with the following keys:
  - time: time elapsed since start of video
  - dom: DOM structure
  - action: action performed at that moment
  -link to screenshot
  - current view port coordinates
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

// Take the screenshot of the browser
// recorder.takeScreenshot = function(screenshotFileName) {
//     html2canvas(document.body).then(canvas => {
//         // Create an image
//         var image = canvas.toDataURL("image/png");

//         // Create a link to download the image with the specified file name
//         var link = document.createElement('a');
//         link.href = image;
//         link.download = screenshotFileName + '.png'; // Use the provided file name
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     });
// }

//Takes a screenshot
//uses a boolean to make sure no other screenshot can occur while a screenshot is happening
recorder.takeScreenshot = function(screenshotFileName) {
  if (recorder.isTakingScreenshot) return;
  recorder.isTakingScreenshot = true;

  html2canvas(document.body).then(canvas => {
      var image = canvas.toDataURL("image/png");
      var link = document.createElement('a');
      link.href = image;
      link.download = screenshotFileName + '.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      recorder.isTakingScreenshot = false;
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
  recorder.data = {};
  recorder.data.taskName = recorder.taskName;
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

// Add a state to the recording data
recorder.addState = function (event, action) {
  if (!recorder.isRecording) return;
  if (event && action)
    action.timing = event.eventPhase;
  console.log('Adding state', action);
  var state = {
    'time': new Date().getTime() - core.ept0,
    'action': action,
  };
  if (event)
    event.target.dataset.recording_target = true;
  state.dom = core.getDOMInfo();
  if (event)
    delete event.target.dataset.recording_target;
  recorder.data.states.push(state);
}

recorder.ondblclick = function (event) {
  console.log("double click state")
  if (event.target === core.cover_div ||
      event.pageX >= 160 || event.pageY >= 210)
    return;

    var action = {
      'type': 'dbclick',
      'x': event.pageX,
      'y': event.pageY
  };
  // Add state immediately with action details
  recorder.addState(event, action);

  // Logic for double click event
  var screenshotFileName = 'dblclick_' + Date.now();
  recorder.takeScreenshot(screenshotFileName);
  var screenshotLink = screenshotFileName + '.png';

//   // Delay only the screenshot capture
//   setTimeout(function() {
//     var screenshotFileName = 'click_' + Date.now();
//     recorder.takeScreenshot(screenshotFileName);
//     var screenshotLink = screenshotFileName + '.png';
//     console.log("Screenshot taken", screenshotLink);

//     // Update the action object with screenshot link
//     action.screenshotLink = screenshotLink;
// }, 30); // Delay of 30 ms

};

recorder.onclick = function (event) {
  console.log("click state")
  if (event.target === core.cover_div ||
      event.pageX >= 160 || event.pageY >= 210)
      return;

  var action = {
      'type': 'click',
      'x': event.pageX,
      'y': event.pageY
  };

  // Add state immediately with action details
  recorder.addState(event, action);

  // Delay only the screenshot capture
  // setTimeout(function() {
  //     var screenshotFileName = 'click_' + Date.now();
  //     recorder.takeScreenshot(screenshotFileName);
  //     var screenshotLink = screenshotFileName + '.png';
  //     console.log("Screenshot taken", screenshotLink);

  //     // Update the action object with screenshot link
  //     action.screenshotLink = screenshotLink;
  // }, 30); // Delay of 30 ms
};


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
}

