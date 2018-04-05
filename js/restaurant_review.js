let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
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
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      console.log(restaurant);
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
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
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  //Add link on breadcrumb to restaurant details
  const liRestaurant = document.createElement('li');

  const aRestaurant = document.createElement('a');

  aRestaurant.id = "breadcrumb-restaurant";
  aRestaurant.innerHTML = restaurant.name;
  aRestaurant.setAttribute('href', `/restaurant.html?id=${restaurant.id}`);
  aRestaurant.setAttribute('tabindex','1');
  liRestaurant.appendChild(aRestaurant);
  breadcrumb.appendChild(liRestaurant);

  //Add current page
  const li = document.createElement('li');
  li.innerHTML = 'New review';
  //li.setAttribute('aria-current','page')
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

/**
 * Function that retrieves the information from the form and submits the data to the server
 */
function submitReview(){
  const submitBtn = document.getElementById('review-submit');
  submitBtn.setAttribute('disabled','disabled');

  const id = getParameterByName('id');
  const txtNameCtrl = document.getElementById('review-name');
  const selectRatingCtrl = document.getElementById('review-rating');
  const txtCommentsCtrl = document.getElementById('review-comments');
  const reviewResultRow = document.getElementById('review-result');
  var localError = '';
  while (reviewResultRow.firstChild) {
    reviewResultRow.removeChild(reviewResultRow.firstChild);
  }
  console.log(`${txtCommentsCtrl.value};${selectRatingCtrl.value};${txtCommentsCtrl.value}`);

  if(txtNameCtrl.value == '' && txtCommentsCtrl.value == ''){
    txtNameCtrl.focus();
    localError = 'You must fill the name and the comments.';
  }
  else if(txtNameCtrl.value == ''){
    txtNameCtrl.focus();
    localError = 'You must fill the name.';
  }
  else if(txtCommentsCtrl.value == ''){
    txtCommentsCtrl.focus();
    localError = 'You must fill the comments.';
  }
  if(localError != ''){
    reviewResultRow.appendChild(getOperationMessage('failure', localError));
    submitBtn.removeAttribute('disabled');
  }
  else{
    var dbReview = {
      restaurant_id: id,
      name: txtNameCtrl.value,
      rating: selectRatingCtrl.value,
      comments: txtCommentsCtrl.value
    };
    DBHelper.postReviewInfo(dbReview, (error, result) => {
      if (error) { // Got an error
        reviewResultRow.appendChild(getOperationMessage('failure', error));
      } else {
        txtNameCtrl.value = '';
        selectRatingCtrl.value = '3';
        txtCommentsCtrl.value = '';
        reviewResultRow.appendChild(getOperationMessage('success', 'Your review was successfully submited.'));
      }
      submitBtn.removeAttribute('disabled');
    })
  }
}

document.onkeydown = captureTabKeyEventsRestaurant;

/**
 * Function that creates an html tag to display the operation result
 */
function getOperationMessage(success, message){
  const messageElement = document.createElement('p');
  messageElement.innerText = message;
  messageElement.className = success;
  messageElement.setAttribute('role','alert');
  return messageElement;
}

/**
 * Function that captures and handles tab and inverse tab clicks
 */
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