let _restaurant = undefined;
let _restaurantId = undefined;
let _isRestaurantFavorite = undefined;
let _loadFullInfo = undefined;
const _port = 1337; // Change this to match the port defined in the nodejs project
const _baseRestaurantUrl = `http://localhost:${_port}/restaurants`;
const _baseReviewUrl = `http://localhost:${_port}/reviews`;
/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Restaurants URL.
   */
  static get RESTAURANTS_URL() {
    var url = _baseRestaurantUrl;
    if(_restaurantId != undefined) url += `/${_restaurantId}`;
    if(_isRestaurantFavorite != undefined) url += `/?is_favorite=${_isRestaurantFavorite}`;
    return url;
  }

  /**
   * Reviews URL.
   */
  static get REVIEWS_URL() {
    var url = _baseReviewUrl;
    if(_restaurantId != undefined) url += `/?restaurant_id=${_restaurantId}`;
    return url;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    _restaurantId = undefined;
    _isRestaurantFavorite = undefined;
    _loadFullInfo = undefined;
    DBHelper.fetchRestaurantInfo(callback);
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, fullInfo, callback) {
    _restaurantId = id;
    _isRestaurantFavorite = undefined;
    _loadFullInfo = fullInfo;
    DBHelper.fetchRestaurantInfo(callback);
  }

  static postRestaurantInfoByIdAndIsFavorite(restaurant, callback){
    _restaurant = restaurant;
    _restaurantId = restaurant.id;
    _isRestaurantFavorite = restaurant.is_favorite;
    _loadFullInfo = undefined;
    DBHelper.postRestaurantInfo(callback);
  }

  /**
   * Abstract method for posting review info.
   */
  static postReviewInfo(id, dbReview, callback){
    //First, we'll try to update the local db info
    var reviewArray;
    if(Array.isArray(dbReview)){
      reviewArray = dbReview;
    }
    else{
      reviewArray = new Array();
      reviewArray.push(dbReview);
    }
    var data = {
      command:'AddReviews',
      reviews: reviewArray
    };
    //sendMessageToSW(data).then(function(result){
      return fetch(_baseReviewUrl,
        {
          method: 'POST',
          body: JSON.stringify( dbReview ),
          headers: {
            'content-type': 'application/json'
          },
        }
      ).then(function(response) {
        //console.log('Request sent');
        return response.json();
      }).then(function(jsonResponse) {
        console.log('jsonResponse:');
        console.log(jsonResponse);
        callback(null, jsonResponse);
      }).catch(function(error){
        //Here, we'll warn the user that wasn't possible to commit the changes to the server
        console.error(error);
        var requestData = {
          tableRecordId: 'review_'+_restaurantId, 
          requestUrl: _baseReviewUrl,
          requestInfo: dbReview,
        };
        sendMessageToSW({command:'AddFailedRequest', failedRequest: requestData})
        .then(function(msgResult){
          callback(null, msgResult);
        })
        .catch(function(error){
          callback(error, null);
        })
      })
      /*
    }).catch(function(errorMsg){
      //Here, we'll warn the user that wasn't possible to commit the changes to the local db
      console.error(errorMsg);
      callback(errorMsg, null);
    }) 
    */
  } 

  /**
   * Abstract method for posting restaurant info.
   */
  static postRestaurantInfo(callback) {
    return fetch(DBHelper.RESTAURANTS_URL,
      {
        method: 'POST'
      }
    ).then(function(fetchResponse) {
        return fetchResponse.json();
    }).then(function(jsonResponse) {
      callback(null, jsonResponse);
    }).catch(function(error) {
      //Here we'll update the info locally and keep a record of the failed request to retry when the
      //connection is restablished
      var restaurantArray= [];
      restaurantArray.push(_restaurant);
      var requestData = {
        tableRecordId: 'restaurant_'+_restaurantId,
        requestUrl: DBHelper.RESTAURANTS_URL,
        requestInfo: {},
      };
      sendMessageToSW({command:'AddFailedRequest', failedRequest: requestData});
      sendMessageToSW({command:'AddRestaurants', restaurants:restaurantArray})
      callback(null, {});
    })
  }

  

  /**
   * Abstract method for fetching restaurant info.
   */
  static fetchRestaurantInfo(callback) {
    var _reviewUrl = DBHelper.REVIEWS_URL;
    if(_loadFullInfo != true){
      _reviewUrl = undefined;
    }
    sendMessageToSW(
      {
        command:'FetchRestaurantFromServer', 
        restaurantUrl: DBHelper.RESTAURANTS_URL,
        reviewUrl: _reviewUrl
      }
    )
    .then(function(jsonObject) {
      if(!jsonObject.success){
        throw 'FetchRestaurantFromServer Error';
      }
      var restaurantArray;
      var reviewArray;
      var restaurant= jsonObject.restaurants;
      if(Array.isArray(restaurant)){
        restaurantArray = restaurant;
      }
      else{
        restaurantArray = [];
        restaurantArray.push(restaurant);
      }
      sendMessageToSW({command:'AddRestaurants', restaurants:restaurantArray});
      if(_loadFullInfo == true){
        sendMessageToSW({command:'AddReviews', reviews:jsonObject.reviews});
        restaurant.reviews = jsonObject.reviews;
      }
      callback(null, restaurant);
    })
    .catch(function(error) {
      //Let's try to fetch from IndexedDB
      console.error(error);
      var data = {};
      if(_restaurantId == undefined){
        data.command = 'GetAllRestaurants'
      }
      else if(_loadFullInfo == true){
        data.command = 'GetRestaurantWithReviews',
        data.id = _restaurantId;
      }
      else{
        data.command = 'GetRestaurant',
        data.id = _restaurantId;
      }
      sendMessageToSW(data).then(function(result){
        if(data.command == 'GetAllRestaurants'){
          const restaurants = result.data;
          console.log(restaurants);
          callback(null, restaurants);
        }
        else{
          console.log(result.data);
          callback(null, result.data);
        }
      }).catch(function(errorMsg){
        console.error(errorMsg);
        callback(errorMsg, null);
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
   * New review page URL.
   */
  static urlForNewReview(restaurant) {
    return (`./review.html?id=${restaurant.id}`);
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
