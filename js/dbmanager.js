let dbName = 'mws-restaurant-db';
let dbStoreName = 'restaurant';
let dbVersion = 1;
var dbStore = null;

let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
let IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
let IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

class DBManager {
  static openDatabase(callback) {
    var dbRequest = indexedDB.open(dbName, dbVersion);

    dbRequest.onupgradeneeded = function(e) {
      var thisDB = e.target.result;
      if(!thisDB.objectStoreNames.contains(dbStoreName)) {
        // Create a new datastore with url as primary key.
        var store = db.createObjectStore(dbStoreName, {
          keyPath: 'url'
        });
        //Create an index for the primary key
        store.createIndex('url', 'url', { unique: true });
      }
    }

    dbRequest.onsuccess = function(e) {
      // Get a reference to the DB.
      dbStore = e.target.result;
    
      // Execute the callback.
      if(callback) callback();
    };

    // Handle errors when opening the datastore.
    dbRequest.onerror = DBManager.onerror;
  }

  static addRestaurant(dbUrl, dbRestaurant, callback) {
    // Initiate a new transaction.
    var transaction = dbStore.transaction([dbStoreName], 'readwrite');
  
    // Get the datastore.
    var objStore = transaction.objectStore(dbStoreName);

    // Create the datastore request.
    var dbRequest = objStore.add({url: dbUrl, restaurant: dbRestaurant});
  
    // Handle a successful datastore put.
    dbRequest.onsuccess = function(e) {
      // Execute the callback function.
      callback(todo);
    };
  
    // Handle errors.
    dbRequest.onerror = iDB.onerror;
  };
}
/*
var indexedDB = (function() {
    const dbName = 'mws-restaurant-db';
    const dbStoreName = 'restaurant';
    const dbVersion = 1;
    
    var iDB = {};
    var dbStore = null;
    
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    // Methods for interacting with the database here.
    iDB.open = function(callback) {
      // Open a connection to the datastore.
      var dbRequest = indexedDB.open(dbName, dbVersion);
      
      // Handle datastore upgrades.
      dbRequest.onupgradeneeded = function(e) {
        var db = e.target.result;
        e.target.transaction.onerror = tDB.onerror;
      
        // Delete the old datastore.
        if (db.objectStoreNames.contains(dbStoreName)) {
          db.deleteObjectStore(dbStoreName);
        }
      
        // Create a new datastore.
        var store = db.createObjectStore(dbStoreName, {
          keyPath: 'url'
        });
        
        (())
        store.createIndex('url', 'url', { unique: true });
      };
      
      // Handle successful datastore access.
      dbRequest.onsuccess = function(e) {
        // Get a reference to the DB.
        dbStore = e.target.result;
      
        // Execute the callback.
        callback();
      };
      
      // Handle errors when opening the datastore.
      dbRequest.onerror = tDB.onerror;
    };

    iDB.add = function(restaurant, callback) {
        // Get a reference to the db.
        var db = dbStore;
      
        // Initiate a new transaction.
        var transaction = db.transaction([dbStoreName], 'readwrite');
      
        // Get the datastore.
        var objStore = transaction.objectStore(dbStoreName);

        // Create the datastore request.
        var dbRequest = objStore.add(todo);
      
        // Handle a successful datastore put.
        dbRequest.onsuccess = function(e) {
          // Execute the callback function.
          callback(todo);
        };
      
        // Handle errors.
        dbRequest.onerror = iDB.onerror;
      };
    // Export the iDB object.
    return iDB;
  }());
*/
/*
var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

const databaseName = 'mws-restaurant-db';
const databaseStore = 'mws-restaurant-store';
const databaseVersion = 1;

document.addEventListener('DOMContentLoaded', (event) => {
  console.log("DOMContentLoaded begin");
  if(!indexedDB) return;
  console.log("DOMContentLoaded indexedDB is true");
  var dbRequest = indexedDB.open(databaseName, databaseVersion);
  dbRequest.onupgradeneeded = function(e) {
    var thisDB = e.target.result;
    if(!thisDB.objectStoreNames.contains(databaseStore)) {
      thisDB.createObjectStore(databaseStore);
    }
  }

  dbRequest.onsuccess = function(e) {
    console.log("DOMContentLoaded onsuccess");
    db = e.target.result;
  }

  dbRequest.onerror = function(e) {
    console.log("DOMContentLoaded onerror", e.target.error.name);
  }
});

function addRestaurant(restaurant) {
  var transaction = indexedDB.transaction([databaseStore],"readwrite");
  var store = transaction.objectStore(databaseStore);

  //Perform the add
  var request = store.add(restaurant, 1);
 
  request.onerror = function(e) {
    console.log("addRestaurant onerror", e.target.error.name);
  }
 
  request.onsuccess = function(e) {
    console.log("addRestaurant onsuccess");
  }
}
*/