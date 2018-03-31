const staticCacheName = 'mws-restaurant-static-v1';

const dbName = 'mws-restaurant-db';
const dbStoreName = 'restaurant';
const dbVersion = 1;
var dbStore = null;

var allCaches = [
  staticCacheName
];

/* IndexedDB functions - Start */
function openDatabase(){
  var dbRequest = indexedDB.open(dbName, dbVersion);

  dbRequest.onupgradeneeded = function(e) {
    var thisDB = e.target.result;
    if(!thisDB.objectStoreNames.contains(dbStoreName)) {
      // Create a new datastore with url as primary key.
      var store = thisDB.createObjectStore(dbStoreName, {
        keyPath: 'url'
      });
      //Create an index for the primary key
      store.createIndex('url', 'url', { unique: true });
    }
  }

  dbRequest.onsuccess = function(e) {
    // Get a reference to the DB.
    dbStore = e.target.result;
  };

  // Handle errors when opening the datastore.
  dbRequest.onerror = function(e) {
    // Get a reference to the DB.
    dbStore = null;
  };
}

// Get the object store
function getObjectStore(storeName, mode) {
  return dbStore.transaction(storeName, mode).objectStore(storeName);
}

function addRestaurant(dbUrl, dbRestaurant, callback) {
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbStoreName, 'readwrite')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    //Sending a request to add an item
    var dbRequest = dbStore.put({
      url: dbUrl,
      restaurant: dbRestaurant
    });
         
    //success callback
    dbRequest.onsuccess = function(e) {
      //console.log('Restaurant Add onsuccess event');
      //console.log(dbRequest);
      resolve({success:true});
    };
         
    //error callback
    dbRequest.onerror = function(e) {
      console.error('Restaurant Add onerror event ' + e.error);
      resolve({success:false, error:e.error});
    };
  });
  return promise;
}

function getRestaurant(url, callback) {
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbStoreName, 'readonly')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    //Sending a request to add an item
    var dbRequest = dbStore.get(url);
         
    //success callback
    dbRequest.onsuccess = function(e) {
      //console.log('Restaurant Get onsuccess event');
      //console.log(dbRequest);
      resolve({data:dbRequest.result, success:true});
    };
         
    //error callback
    dbRequest.onerror = function(e) {
      console.error('Restaurant Get onerror event ' + e.error);
      resolve({error:e.error, success:false});
    };
  });
  return promise;
}

function getAllRestaurants(callback) {
  console.log('Restaurant Get All');
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbStoreName, 'readonly')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    //Sending a request to add an item
    var dbRequest = dbStore.getAll();
         
    //success callback
    dbRequest.onsuccess = function(e) {
      //console.log('Restaurant Get All onsuccess event');
      //console.log(dbRequest);
      resolve({data:dbRequest.result, success:true});
    };
         
    //error callback
    dbRequest.onerror = function(e) {
      console.error('Restaurant Get All onerror event ' + e.error);
      resolve({data:[], error:e.error, success:false});
    };
  });
  return promise;
}

openDatabase();
/* IndexedDB function - End */

/* Serviceworker functions - Start */

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/restaurant.html',
        '/css/styles.css',
        '/img/1.jpg',
        '/img/2.jpg',
        '/img/3.jpg',
        '/img/4.jpg',
        '/img/5.jpg',
        '/img/6.jpg',
        '/img/7.jpg',
        '/img/8.jpg',
        '/img/9.jpg',
        '/img/10.jpg',
        '/manifest.json',
        '/icons/icon-128.png',
        '/icons/icon-256.png',
        '/icons/icon-512.png',
        '/sw.js',
        '/js/dbhelper.js',
        '/js/main.js',
        '/register_sw.js',
        '/js/restaurant_info.js',
      ]);
    })
    /*
    .then(function(){
      self.skipWaiting();
    })
    */
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-restaurant-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      /*
      clients.claim().then(function() {
        return self.clients.matchAll().then(function(clients) {
          return Promise.all(clients.map(function(client) {
            return client.postMessage('Service worker activated.');
          }));
        });
      })
      */
    })
  );
});

self.addEventListener('fetch', function(event) {
  //console.log('Handling fetch event for', event.request.url);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
      /*
      if (response) return response;
      //console.log(`No response for ${event.request.url} found in cache. Trying to fetch from network...`);
      return fetch(event.request.clone()).then(function(response) {
        //console.log(`Response for ${event.request.url} is: ${response}`);
        checkURLForRestaurants(event.request.url, response);
        return response;
      });
      */
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') self.skipWaiting();
  else{
    //console.log(`Received message from main thread:`);
    //console.log(event.data);
    var cmd = event.data.command;
    var data = event.data.restaurants;
    var url = event.data.url;
    switch(cmd){
      case 'put':
        var result = AsyncAddRestaurants(data, url);
        event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        break;
      case 'get':
        var result = AsyncGetRestaurant(url);
        event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        break;
      case 'getAll':
        AsyncGetAllRestaurants().then(function(result){
          event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        })
        
        break;
    }
  }
});

function sendMessageToClient(message) {
  self.clients.matchAll().then(function(clients) {
    clients.map(function(client) {
      return client.postMessage(message);
    })
  });
}

async function AsyncAddRestaurants(data, url){
  var result = await Promise.all(data.map(async (restaurantObj, index) => {
    //console.log(restaurantObj);
    var restaurantUrl = `${url}/${restaurantObj.id}`;
    const response = addRestaurant(restaurantUrl, restaurantObj);
  }));
  return result;
}

async function AsyncGetRestaurant(url){
  var result = await getRestaurant(url);
  return result;
}

async function AsyncGetAllRestaurants(){
  var result = await getAllRestaurants();
  return result;
}

/* Serviceworker functions - End */