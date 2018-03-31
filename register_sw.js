'use strict';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', function(event) {
    console.log(`Received message from service worker:`);
    console.log(event.data);
  });

  navigator.serviceWorker.register('/sw.js', {
    scope: '/'
  })
  .then(function(serviceWorkerRegistration) {
    console.log(`Service worker registered with scope ${serviceWorkerRegistration.scope}`);
  }).catch(function(error) {
    console.log(`Service worker registration: error ${error}`);
  });
}

function sendMessageToSW(message) {
  return new Promise(function(resolve, reject) {
    if(!navigator.serviceWorker.controller) reject(null);
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = function(event) {
      console.log('Received direct message from service worker');
      console.log(event.data);
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2])
  });
}