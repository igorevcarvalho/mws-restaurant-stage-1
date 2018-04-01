let restaurantId = undefined;
const port = 1337; // Change this to match the port defined in the nodejs project
const baseUrl = `http://localhost:${port}/restaurants`;
/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get RESTAURANTS_URL() {
    var url = baseUrl;
    if(restaurantId != undefined) url += `/${restaurantId}`;
    return url;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    restaurantId = undefined;
    DBHelper.fetchRestaurantInfo(callback);
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    restaurantId = id;
    DBHelper.fetchRestaurantInfo(callback);
  }

  /**
   * Abstract method for fetching restaurant info.
   */
  static fetchRestaurantInfo(callback) {
    return fetch(DBHelper.RESTAURANTS_URL)
      .then(function(response) {
        return response.json();
    })
    .then(function(jsonRestaurant) {
      var array;
      if(Array.isArray(jsonRestaurant)){
        array = jsonRestaurant;
      }
      else{
        array = [];
        array.push(jsonRestaurant);
      }
      var clientMsg = sendMessageToSW({command:'put', restaurants:array, url:baseUrl});
      callback(null, jsonRestaurant);
    })
    .catch(function(error) {
      //Let's try to fetch from IndexedDB
      var data = {};
      if(restaurantId == undefined){
        data.command = 'getAll'
      }
      else{
        data.command = 'get',
        data.url = DBHelper.RESTAURANTS_URL;
      }
      sendMessageToSW(data).then(function(result){
        if(data.command == 'getAll'){
          const restaurants = result.data.map((v, i) => result.data[i].restaurant)
          //console.log(restaurants);
          callback(null, restaurants);
        }
        else{
          callback(null, result.data);
        }
      }).catch(function(){
        callback(error, null);
      })
      ;
    })
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        //console.log(restaurants);
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        //console.log(neighborhoods);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        //console.log(uniqueNeighborhoods);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph != undefined) 
      return (`/img/${restaurant.photograph}.webp`);
    else
      return (`/img/${restaurant.id}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
