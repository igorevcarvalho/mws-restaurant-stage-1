let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  sendMessageToSW({command:'RetryFailedRequests'}).then(function(){
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        self.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      }
    });
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = parseInt(getParameterByName('id'));
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else if (self.restaurant != undefined){
    console.log('Restaurant already fetched');
    callback(null, self.restaurant);
  } else{
    DBHelper.fetchRestaurantById(id, true, (error, restaurant) => {
      //console.log(restaurant);
      if(!self.restaurant && restaurant)
        self.restaurant = restaurant;
      if (!self.restaurant) {
        //console.error(error);
        return;
      }
      
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  const id = getParameterByName('id');
  image.alt = 'An image of ' + restaurant.name + ', a pleasant place to eat.';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  var count = 0;
  var index = parseInt(document.getElementById('restaurant-hours').getAttribute('tabindex')) + 1;
  const container = document.getElementById('reviews-container');

  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  title.setAttribute('tabindex', index);
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    title.setAttribute('aria-label',title.innerHTML + ' ' + noReviews.innerHTML);
    return;
  }
  const ul = document.getElementById('reviews-list');
  
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review, index));
    count++;
    index++;
  });
  if(count == 1) {
    title.setAttribute('aria-label',title.innerHTML + ' ( There is ' + count + ')');
  }
  else
  {
    title.setAttribute('aria-label',title.innerHTML + ' ( There are ' + count + ')');
  }
  container.appendChild(ul);
  document.getElementById('footer').setAttribute('tabindex', index);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, index) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', index);

  const name = document.createElement('p');
  name.setAttribute('id', `review-name-${index}`);
  name.setAttribute('class', `name`);
  name.innerHTML = review.name;
  li.appendChild(name);

  var reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const date = document.createElement('p');
  date.setAttribute('id', `review-date-${index}`);
  date.setAttribute('class', `date`);
  date.innerHTML = reviewDate;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.setAttribute('id', `review-rating-${index}`);
  rating.setAttribute('class', `rating`);
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.setAttribute('id', `review-comments-${index}`);
  comments.innerHTML = review.comments;
  li.appendChild(comments);
  
  li.setAttribute('aria-label',`A review from ${review.name} on ${reviewDate.replace(',','')}, rated ${review.rating} out of 5. ${review.comments}`);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current','page')
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

document.onkeydown = captureTabKeyEventsRestaurant;

function captureTabKeyEventsRestaurant(evt) {
  var evt = (evt) ? evt : ((event) ? event : null);
  var tabKey = 9;
  var activeElemId = document.activeElement.id;
  //shift was down when tab was pressed
  if(evt.shiftKey && evt.keyCode == tabKey &&
    (activeElemId == 'home-link'
      || activeElemId == 'restaurant-name')) {
    event.preventDefault();
    switch(activeElemId) {
      case 'home-link':
        document.getElementById('footer').focus();
        break;
      case 'restaurant-name':
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
        document.getElementById('restaurant-name').focus();
        break;
    }
  }
  
}