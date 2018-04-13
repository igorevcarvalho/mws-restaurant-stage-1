const staticCacheName = 'mws-restaurant-static-v1';

const dbName = 'mws-restaurant-db';
const dbRestaurantStoreName = 'restaurant';
const dbReviewStoreName = 'review';
const dbFailedRequestsStoreName = 'failed';
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
    if(!thisDB.objectStoreNames.contains(dbRestaurantStoreName)) {
      // Create a new datastore with url as primary key.
      var restaurantStore = thisDB.createObjectStore(dbRestaurantStoreName, {
        keyPath: 'id'
      });
      //Create an index for the primary key
      restaurantStore.createIndex('id', 'id', { unique: true });
    }
    if(!thisDB.objectStoreNames.contains(dbReviewStoreName)) {
      // Create a new datastore with url as primary key.
      var reviewStore = thisDB.createObjectStore(dbReviewStoreName, {
        keyPath: 'id'
      });
      //Create an index for the review id
      reviewStore.createIndex('id', 'id', { unique: true });
      //Create an index for the restaurant_id
      reviewStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
    }
    if(!thisDB.objectStoreNames.contains(dbFailedRequestsStoreName)) {
      // Create a new datastore with url as primary key.
      var failedRequestsStore = thisDB.createObjectStore(dbFailedRequestsStoreName, {
        keyPath: 'id', autoIncrement: true
      });
      //Create an index for the primary key
      failedRequestsStore.createIndex('id', 'id', { unique: true });
      failedRequestsStore.createIndex('tableRecordId', 'tableRecordId', { unique: false });
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

function addFailedRequest(dbFailedRequest, callback){
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbFailedRequestsStoreName, 'readwrite')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    //Sending a request to add an item
    var dbRequest = dbStore.put(dbFailedRequest);
         
    //success callback
    dbRequest.onsuccess = function(e) {
      //console.log('Restaurant Add onsuccess event');
      //console.log(dbRequest);
      resolve({success:true});
    };
         
    //error callback
    dbRequest.onerror = function(e) {
      console.error('Failed Request Add onerror event ' + e.error);
      resolve({success:false, error:e.error});
    };
  });
  return promise;
}
/*
function getAllFailedRequests(tableRecordId) {
  console.log('FailedRequests Get All');
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbFailedRequestsStoreName, 'readonly')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    //Sending a request to add an item
    var dbRequest = null; //dbStore.getAll();
    if(tableRecordId != null){
      // Select the proper index
      var index = dbStore.index("table_record_id");
      // Sending a request toget items
      dbRequest = index.get(tableRecordId);
    }
    else{
      dbRequest = dbStore.getAll();
    }
    //success callback
    dbRequest.onsuccess = function(e) {
      //console.log('Restaurant Get All onsuccess event');
      //console.log(dbRequest);
      resolve({data:dbRequest.result, success:true});
    };
         
    //error callback
    dbRequest.onerror = function(e) {
      console.error('FailedRequests Get All onerror event ' + e.error);
      resolve({data:[], error:e.error, success:false});
    };
  });
  return promise;
}
*/
function getAllFailedRequests(tableRecordId, callback) {
  console.log('FailedRequests Get All with id: ' + tableRecordId);
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbFailedRequestsStoreName, 'readonly')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    // Select the proper index
    var index = dbStore.index("tableRecordId");
    var result = [];
    //Sending a request to add an item
    var dbRequest = null;
    if(tableRecordId != undefined){
      var range = IDBKeyRange.only(tableRecordId);
      dbRequest = index.openCursor(range);
    }
    else{
      dbRequest = index.openCursor();
    }
    //success callback
    dbRequest.onsuccess = function(e) {
      var cursor = e.target.result;
      
      if(cursor) {
        result.push(cursor.value);
        cursor.continue();
      } else {
        resolve({data:result, success:true});
      }
    };
         
    //error callback
    dbRequest.onerror = function(e) {
      console.error('FailedReviews Get All onerror event ' + e.error);
      resolve({data:[], error:e.error, success:false});
    };
  });
  return promise;
}

function deleteFailedRequest(id, callback){
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbFailedRequestsStoreName, 'readwrite')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    //Sending a request to add an item
    var dbRequest = dbStore.delete(id);
         
    //success callback
    dbRequest.onsuccess = function(e) {
      //console.log('Restaurant Add onsuccess event');
      //console.log(dbRequest);
      resolve({success:true});
    };
         
    //error callback
    dbRequest.onerror = function(e) {
      console.error('Failed Request Delete onerror event ' + e.error);
      resolve({success:false, error:e.error});
    };
  });
  return promise;
}

function addRestaurant(dbRestaurant, callback) {
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbRestaurantStoreName, 'readwrite')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    //Sending a request to add an item
    var dbRequest = dbStore.put(dbRestaurant);
         
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

function getRestaurant(id, callback) {
  // Get the datastore, then add record.
  console.log('Restaurant Get');
  var dbStore = getObjectStore(dbRestaurantStoreName, 'readonly')
  
  // Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    // Select the proper index
    var index = dbStore.index("id");
    // Sending a request to add an item
    var dbRequest = index.get(id);
         
    // success callback
    dbRequest.onsuccess = function(e) {
      //console.log('Restaurant Get onsuccess event');
      //console.log(dbRequest.result.restaurant);
      resolve({data:dbRequest.result, success:true});
    };
         
    //error callback
    dbRequest.onerror = function(e) {
      console.error('Restaurant Get onerror event ' + e.error);
      resolve({data:null, error:e.error, success:false});
    };
  });
  return promise;
}

function getAllRestaurants(callback) {
  console.log('Restaurant Get All');
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbRestaurantStoreName, 'readonly')
  
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

function addReview(dbReview, callback) {
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbReviewStoreName, 'readwrite')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    //Sending a request to add an item
    var dbRequest = dbStore.put(dbReview);
         
    //success callback
    dbRequest.onsuccess = function(e) {
      //console.log('Review Add onsuccess event');
      //console.log(dbRequest);
      resolve({success:true});
    };
         
    //error callback
    dbRequest.onerror = function(e) {
      console.error('Review Add onerror event ' + e.error);
      resolve({success:false, error:e.error});
    };
  });
  return promise;
}

function getRestaurantReviews(restaurant_id, callback) {
  // Get the datastore, then add record.
  var dbStore = getObjectStore(dbReviewStoreName, 'readonly')
  
  //Wrapping logic inside a promise
  var promise = new Promise(function(resolve, reject){
    // Select the proper index
    var index = dbStore.index("restaurant_id");
    // Sending a request to add an item
    //var dbRequest = index.get(restaurant_id);
         
    //success callback
    /*
    dbRequest.onsuccess = function(e) {
      //console.log('RestaurantReviews Get onsuccess event');
      resolve({data:dbRequest.result, success:true});
    };
    */
   
   var result = [];
   //Sending a request to add an item
   var dbRequest = null;
   if(restaurant_id != undefined){
     var range = IDBKeyRange.only(restaurant_id);
     dbRequest = index.openCursor(range);
   }
   else{
     dbRequest = index.openCursor();
   }
   //success callback
   dbRequest.onsuccess = function(e) {
     var cursor = e.target.result;
     
     if(cursor) {
       result.push(cursor.value);
       cursor.continue();
     } else {
       resolve({data:result, success:true});
     }
   };

    //error callback
    dbRequest.onerror = function(e) {
      console.error('RestaurantReviews Get onerror event ' + e.error);
      resolve({data:null, error:e.error, success:false});
    };
  });
  return promise;
}

function retryFailedPosts(){
  console.log('Retrying to post information to server...');
}

openDatabase();
//retryFailedPosts();
/* IndexedDB function - End */

/* Serviceworker functions - Start */

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        '/img/1.webp',
        '/img/2.webp',
        '/img/3.webp',
        '/img/4.webp',
        '/img/5.webp',
        '/img/6.webp',
        '/img/7.webp',
        '/img/8.webp',
        '/img/9.webp',
        '/img/10.webp',
        '/manifest.json',
        '/icons/icon-128.png',
        '/icons/icon-256.png',
        '/icons/icon-512.png',

        '/index.html',
        '/restaurant.html?id=1',
        '/restaurant.html?id=2',
        '/restaurant.html?id=3',
        '/restaurant.html?id=4',
        '/restaurant.html?id=5',
        '/restaurant.html?id=6',
        '/restaurant.html?id=7',
        '/restaurant.html?id=8',
        '/restaurant.html?id=9',
        '/restaurant.html?id=10',
        '/review.html?id=1',
        '/review.html?id=2',
        '/review.html?id=3',
        '/review.html?id=4',
        '/review.html?id=5',
        '/review.html?id=6',
        '/review.html?id=7',
        '/review.html?id=8',
        '/review.html?id=9',
        '/review.html?id=10',
        '/css/base.css',
        '/css/index.css',
        '/css/restaurant.css',
        '/sw.js',
        '/js/dbhelper.js',
        '/js/main.js',
        '/register_sw.js',
        '/js/restaurant_info.js',
        '/js/restaurant_review.js',

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
    var restaurants = event.data.restaurants;
    var reviews = event.data.reviews;
    var failedRequest = event.data.failedRequest;
    var restaurantUrl = event.data.restaurantUrl;
    var reviewUrl = event.data.reviewUrl;
    var id = 0;
    if(event.data.id != undefined) {
      id = parseInt(event.data.id);
    }
    switch(cmd){
      case 'RetryFailedRequests':
        AsyncRetryFailedRequests().then(function(result){
          event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        }).catch(function(error){
          console.error('Not possible to retry failed requests');
        });
        break;
      case 'AddFailedRequest':
        AsyncAddFailedRequest(failedRequest).then(function(result){
          event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        })
        break;
      case 'GetAllFailedRequests':
        AsyncGetAllFailedRequests().then(function(result){
          event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        })
        break;
      case 'DeleteFailedRequest':
        AsyncDeleteFailedRequest(id).then(function(result){
          //event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        })
        break;
      case 'AddRestaurants':
        AsyncAddRestaurants(restaurants).then(function(result){
          //event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        })
        break;
      case 'GetRestaurant':
        AsyncGetRestaurant(id, false).then(function(result){
          event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        })
        break;
      case 'GetRestaurantWithReviews':
        AsyncGetRestaurant(id, true).then(function(result){
          event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        })
        break;
      case 'GetAllRestaurants':
        AsyncGetAllRestaurants().then(function(result){
          event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        })
        break;
      case 'AddReviews':
        AsyncAddReviews(reviews).then(function(result){
          event.ports[0].postMessage(JSON.parse(JSON.stringify(result)));
        })
        break;
      case 'FetchRestaurantFromServer':
        AsyncFetchRestaurantFromServer(restaurantUrl, reviewUrl).then(function(result){
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

async function AsyncRetryFailedRequests(){
  console.log('Fetching failed requests...');
  try{
    var failedRequests = await getAllFailedRequests(undefined);
    var retries = await Promise.all(failedRequests.data.map(async (requestObj, index) => {
      console.log(requestObj);
      return fetch(requestObj.requestUrl,
        {
          method: 'POST',
          body: JSON.stringify(requestObj.requestInfo),
          headers: {
            'content-type': 'application/json'
          },
        }).then(function(response){
          return AsyncDeleteFailedRequest(requestObj.id);
        }).catch(function(error){
          return Promise.resolve({});
        });
    }));
    return retries;
  }catch(e){
    return Promise.resolve({});
  }
}

async function AsyncAddFailedRequest(data){
  var result = await addFailedRequest(data);
  return result;
}

async function AsyncGetAllFailedRequests(tableRecordId){
  var result = await getAllFailedRequests(tableRecordId);
  return result;
}

async function AsyncDeleteFailedRequest(id){
  var result = await deleteFailedRequest(id);
  return result;
}

async function AsyncAddRestaurants(data){
  var result = await Promise.all(data.map(async (restaurantObj, index) => {
    const response = addRestaurant(restaurantObj);
  }));
  return result;
}

async function AsyncGetRestaurant(id, withReviews){
  var restaurant = await getRestaurant(id);
  let restaurantJson = restaurant.data;
  let tableRecordId = 'review_'+id;
  if(withReviews){
    var reviews = await getRestaurantReviews(id);
    var failedReviews = await getAllFailedRequests(tableRecordId);
    restaurantJson.reviews = [];
    if(reviews.data != undefined){
      restaurantJson.reviews = restaurantJson.reviews.concat(reviews.data);
    }
    if(failedReviews.data != undefined){
      restaurantJson.reviews = restaurantJson.reviews.concat(
        failedReviews.data.map((v, i) => v.requestInfo)
      );
    }
  }
  return {data:restaurantJson};
}

async function AsyncGetAllRestaurants(){
  var result = await getAllRestaurants();
  return result;
}

async function AsyncAddReviews(data){
  var result = await Promise.all(data.map(async (reviewObj, index) => {
    const response = addReview(reviewObj);
  }));
  return result;
}

async function AsyncFetchRestaurantFromServer(restaurantUrl, reviewUrl){
  try{
    var restaurants = await fetch(restaurantUrl);
    let restaurantsJson = await restaurants.json();
    if(reviewUrl != undefined){
      var reviews = await fetch(reviewUrl);
      let reviewsJson = await reviews.json();
      return {restaurants: restaurantsJson, reviews: reviewsJson, success: true};
    }
    else{
      return {restaurants: restaurantsJson, success: true};
    }
  }catch(e){
    return { success: false};
  }
}

/* Serviceworker functions - End */