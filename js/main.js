let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []
var index = 0

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  document.getElementById('map').setAttribute('aria-hidden', 'true');
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const rList = document.getElementById('restaurants-list');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  
  index = parseInt(rList.getAttribute('tabindex')) + 1;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      if(restaurants == null || restaurants.length == 0)
        rList.setAttribute('aria-label',`There is no restaurant that matches the search criteria.`);
      else if (restaurants.length == 1)
        rList.setAttribute('aria-label',`There is 1 restaurant that matches the search criteria.`);
      else
        rList.setAttribute('aria-label',`There are ${restaurants.length} restaurants that match the search criteria.`);
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      document.getElementById('footer').setAttribute('tabindex', index);
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = 'An image of ' + restaurant.name + ', a pleasant place to eat.';
  image.setAttribute('role', `img`);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  name.setAttribute('role', `heading`);
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.setAttribute('role', `text`);
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.setAttribute('role', `text`);
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `Click to check the info of ${restaurant.name}`);
  more.setAttribute('tabindex',index);
  more.setAttribute('role', `button`);
  index++;
  li.append(more);

  const newReview = document.createElement('a');
  newReview.innerHTML = 'New Review';
  newReview.href = DBHelper.urlForNewReview(restaurant);
  newReview.setAttribute('aria-label', `Click to add a review of ${restaurant.name}`);
  newReview.setAttribute('tabindex',index);
  newReview.setAttribute('role', `button`);
  index++;
  li.append(newReview);

  const favorite = document.createElement('a');
  if(restaurant.is_favorite){
    favorite.innerHTML = 'Remove from favorites';
    favorite.setAttribute('aria-label', `Click to remove ${restaurant.name} from favorites`);
  }
  else{
    favorite.innerHTML = 'Add to favorites';
    favorite.setAttribute('aria-label', `Click to add ${restaurant.name} to favorites`);
  }
  favorite.href = `javascript:toggleFavorite(${restaurant.id},${!restaurant.is_favorite});`;
  favorite.setAttribute('tabindex',index);
  favorite.setAttribute('role', `button`);
  index++;
  li.append(favorite);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

document.onkeydown = captureTabKeyEventsMain;

/**
 * Function that updates the IsFavorite information on the selected restaurant
 */
function toggleFavorite(restaurantId, newIsFavorite){
  updateRestaurants();
}

/**
 * Function that captures and handles tab and inverse tab clicks
 */
function captureTabKeyEventsMain(evt) {
  var evt = (evt) ? evt : ((event) ? event : null);
  var tabKey = 9;
  var activeElemId = document.activeElement.id;
  console.log(activeElemId);
  //shift was down when tab was pressed
  if(evt.shiftKey && evt.keyCode == tabKey &&
    (activeElemId == 'home-link'
      || activeElemId == 'filter-results')) {
    event.preventDefault();
    
    switch(activeElemId) {
      case 'home-link':
        document.getElementById('footer').focus();
        break;
      case 'filter-results':
        document.getElementById('home-link').focus();
        break;
      default:
        break;
    }
  }
  else if(!evt.shiftKey && evt.keyCode == tabKey &&
    (activeElemId == 'footer' 
      || activeElemId == 'home-link')) {
    event.preventDefault();

    switch(activeElemId) {
      case 'footer':
        document.getElementById('home-link').focus();
        break;
      case 'home-link':
        document.getElementById('filter-results').focus();
        break;
    }
  }
  
}