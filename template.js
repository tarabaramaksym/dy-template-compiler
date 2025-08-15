var SCREEN_WIDTH = window.innerWidth;
var container = document.getElementById('dy-recommendations-${dyVariationId}');
var INJECTED_PRODUCTS = [].slice.call(container.querySelectorAll('.dy-recommendation-product')).length;

let itemCount = 0;

const endpoint = 'https://www.byggmax.se/rest/V1/bmx_products/getProductDataByShop';
const token = atob('QmVhcmVyIGVoZG41ZWVvdDc2bHIyMmp1MWR1ZnVnMG16OGNrYXlo');

const addToCartBaseUrl = 'https://www.byggmax.se/checkout/cart/add/';

var slider = null;

setResponsiveAttributes();
parsePriceHtml('.rec_item_${dyVariationId} .rec_price_num');
bindAddToCart();
hidePackageUnits();

function hidePackageUnits() {
  let excludedUnits = ['st', 'stk', 'kpl', 'stk'];
  [].slice.call(container.querySelectorAll('.rec_price_package')).forEach(function(packageUnit) {
    let unitValue = packageUnit.textContent.replace('/','');
      if (excludedUnits.includes(unitValue)) {
        packageUnit.innerHTML = '&nbsp;';
      }
  });
}

function setUspText() {
    let textMap = {
        'Customer Favourite': 'Kund-Favorit',
        'Check out the price': 'Spana in priset',
        'X for': 'för',
        'X for Y': 'för',
        'New': 'Nyhet',
        'Good': 'Bra',
        'Better': 'Bättre',
        'Best': 'Bäst',
        'Smart Choice': 'Smart Val',
        'Greener Choice': 'Ett grönare val',
        'Available Online': 'Endast online'
    };

    let mobileMap = {
        'Customer Favourite': 'Kundfavorit',
    };

    [].slice.call(container.querySelectorAll('.product-usp-element')).forEach(function(balloon) {
        // Default case
        let result = balloon.getAttribute('data-usp'),
            useMap = true;

        if (!result || result === 'None' || result === 'Ingen' || result === 'usp_element' || result === 'none') {
            return;
        }
        

        // Percent discount
        if (result === 'percent-discount' || result === 'Percent Discount (x%)') {
            result = '<strong>' + balloon.getAttribute('data-x-value') + '%</strong>';
            useMap = false;
            balloon.style.display = 'flex';
            balloon.classList.add('percent-discount');
        }

        // X for
        if (result === 'x-for' || result === 'X For') {
            result = '<strong>' + balloon.getAttribute('data-x-value') + '</strong>' + ' ' +  textMap['X For'];
            useMap = false;
        }

        // X for Y
        if (result === 'x-for-y' || result === 'X for Y') {
            result = '<strong>' + balloon.getAttribute('data-x-value') + '</strong>' + ' ' + textMap['X for Y'] + ' ' + '<strong>' + balloon.getAttribute('data-y-value') + '</strong>';
            useMap = false;
        }

        // Fully custom balloon
        if (result === 'custom' || result === 'Custom Text') {
            result = balloon.getAttribute('data-custom-text');
            useMap = false;
        }

        if (useMap) {
            if (mobileMap[result]) {
                balloon.innerHTML = balloon.innerHTML + '<span class="bubble-text bubble-text-mobile">' + mobileMap[result] + '</span>';
            }

            result = textMap[result];
        }
        
        balloon.style.display = 'flex';

        //Avoid displaying "undefined"
        if (!result || result === 'undefined' || result === 'UNDEFINED') {
            balloon.style.display = 'none';
            return;
        }
        
        balloon.innerHTML = balloon.innerHTML + '<span class="bubble-text">' + result + '</span>';
    });
    //DY event for content loaded in PDP recommendation
    typeof DY.API === 'function' ? DY.API("event", {name: "PDP Rec Updated"}) : '';
}

function splitPrice() {
    [].slice.call(container.querySelectorAll('.dy-recommendation-product__detail--price'))
        .forEach(function(el) {
            let splitPrice = el.dataset.price.split('.');

            if (typeof splitPrice[1] !== 'undefined') {
                let decimal = splitPrice[1];

                if (decimal.toString().length === 1) {
                    decimal = decimal + '0';
                }

                if (decimal.toString() !== '00') {
                    el.querySelectorAll('.decimal')[0].textContent = decimal;
                }
            }

            var parsedPrice = splitPrice[0];

            if (parsedPrice.toString().length >= 4) {
                parsedPrice = parsedPrice.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1'+' ');
            }

            el.querySelectorAll('.integer')[0].textContent = parsedPrice;
        });
}

initSlider().then(function() {
    var slider = new Swiper(container.querySelector('.dy-recommendations__slider'), getSliderOptions());
});

function initSlider() {
    var SWIPER_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/Swiper/4.4.6/js/swiper.js';

    return appendJSFile(SWIPER_JS_URL);
}

function setResponsiveAttributes() {
    var ENABLE_ARROWS_DESKTOP = !!parseInt('${Visibility on Desktop}');
    var ENABLE_ARROWS_TABLET = !!parseInt('${Visibility on Tablet}');
    var ENABLE_ARROWS_MOBILE = !!parseInt('${Visibility on Mobile}');

    var ENABLE_PAGINATION_DESKTOP = !!parseInt('${Dots on Desktop}');
    var ENABLE_PAGINATION_TABLET = !!parseInt('${Dots on Tablet}');
    var ENABLE_PAGINATION_MOBILE = !!parseInt('${Dots on Mobile}');

    var settings = [{
        el: '.dy-recommendations-slider-pagination',
        data: {
            'dy-hide--d': !ENABLE_PAGINATION_DESKTOP,
            'dy-hide--t': !ENABLE_PAGINATION_TABLET,
            'dy-hide--m': !ENABLE_PAGINATION_MOBILE,
        }
    }, {
        el: '.dy-recommendations-slider-arrows',
        data: {
            'dy-hide--d': !ENABLE_ARROWS_DESKTOP,
            'dy-hide--t': !ENABLE_ARROWS_TABLET,
            'dy-hide--m': !ENABLE_ARROWS_MOBILE,
        }
    }];

    settings.forEach(function(item) {
        var el = container.querySelector(item.el);
        for (var key in item.data) {
            if (item.data[key]) {
                el.classList.add(key);
            }
        }
    });
}

function getSliderOptions() {
    var ENABLE_AUTOPLAY = !!parseInt('${Autoplay}');
    var AUTOPLAY_SPEED = parseInt('${Autoplay Speed}') * 1000;
    var SCROLL_MULTIPLE_ITEMS = '${Scroll Behavior}' === 'page';

    var ITEMS_TO_DISPLAY_XL = parseInt('${Large Screen}');
    var ITEMS_TO_DISPLAY_DESKTOP = parseInt('${Standard Screen}');
    var ITEMS_TO_DISPLAY_TABLET = parseInt('${Tablet}');
    var ITEMS_TO_DISPLAY_MOBILE = parseInt('${Mobile}');

    var ENABLE_LOOP = 0;
    if(SCREEN_WIDTH <= '${Breakpoint Mobile}' && INJECTED_PRODUCTS > ITEMS_TO_DISPLAY_MOBILE ||
        SCREEN_WIDTH > '${Breakpoint Mobile}' && SCREEN_WIDTH <= '${Breakpoint Tablet}' && INJECTED_PRODUCTS > ITEMS_TO_DISPLAY_TABLET ||
        SCREEN_WIDTH > '${Breakpoint Tablet}' && SCREEN_WIDTH <= '${Breakpoint Desktop}' && INJECTED_PRODUCTS > ITEMS_TO_DISPLAY_DESKTOP ||
        SCREEN_WIDTH > '${Breakpoint Desktop}' && INJECTED_PRODUCTS > ITEMS_TO_DISPLAY_XL){
        ENABLE_LOOP = !!parseInt('${Infinite Scroll}');
    }

    return {
        touchStartPreventDefault: false,
        loop: ENABLE_LOOP,
        loopAdditionalSlides: 0,
        autoplay: ENABLE_AUTOPLAY && {
            delay: AUTOPLAY_SPEED,
        },
        slidesPerView: ITEMS_TO_DISPLAY_XL,
        slidesPerGroup: SCROLL_MULTIPLE_ITEMS ? ITEMS_TO_DISPLAY_XL : 1,
        spaceBetween: 15,
        breakpoints: {
            '${Breakpoint Mobile}': {
                slidesPerView: 1.5,
                slidesPerGroup: 1.5,
                spaceBetween: 15
            },
            '${Breakpoint Tablet}': {
                slidesPerView: ITEMS_TO_DISPLAY_TABLET,
                slidesPerGroup: SCROLL_MULTIPLE_ITEMS ? ITEMS_TO_DISPLAY_TABLET : 1,
                spaceBetween: 15
            },
            '${Breakpoint Desktop}': {
                slidesPerView: ITEMS_TO_DISPLAY_DESKTOP,
                slidesPerGroup: SCROLL_MULTIPLE_ITEMS ? ITEMS_TO_DISPLAY_DESKTOP : 1,
                spaceBetween: 40
            }
        },
        navigation: {
            nextEl: container.querySelector('.dy-recommendations-slider-button--next'),
            prevEl: container.querySelector('.dy-recommendations-slider-button--prev'),
            disabledClass: 'dy-recommendations-slider-button--disabled'
        },
        pagination: {
            el: container.querySelector('.dy-recommendations-slider-pagination'),
            bulletClass: 'dy-recommendations-slider-pagination-bullet',
            bulletActiveClass: 'dy-recommendations-slider-pagination-bullet__active',
            modifierClass: 'dy-recommendations-slider-pagination-',
            clickableClass: 'dy-recommendations-slider-pagination--clickable',
            clickable: true,
            type: 'bullets',
            renderBullet: function (index, className) {
                return '<div class="' + className + '"></div>';
            }
        },
        a11y: {
            notificationClass: 'dy-recommendations-slider--aria-notification'
        },
        slideClass: 'dy-recommendation-product',
        wrapperClass: 'dy-recommendations__slider-wrapper',
        containerModifierClass: 'dy-recommendations__slider-'
    };
}

function appendJSFile(url) {
    return DYO.Q.Promise(function(resolve, reject) {
        if (typeof define === 'function' && define.amd) {
            require([url], function(swiper) {
                window.Swiper = swiper;
                resolve();
            });
            return;
        }

        var js = document.createElement('SCRIPT');
        js.setAttribute('type', 'text/javascript');
        js.setAttribute('src', url);

        js.addEventListener('load', resolve);
        js.addEventListener('error', reject);

        document.head.appendChild(js);
    });
}

function parsePriceHtml(selector) {
    const shopId = getShopId();
    const shop = shopId || false;
    const customerType = getCustomerType();
    const numberHtml = document.querySelectorAll(selector);
    const skus = [];

    numberHtml.forEach((number) => {
        const dynamicPrice = parseInt(number.getAttribute('data-dy-dynamic-price'));
        const sku = number.getAttribute('data-dy-sku');
        if (sku) {
            skus.push(sku);
        }
    });

    if (skus.length > 0) {
        fetchPrices(shop, skus, customerType).then((priceArray) => {
            updatePrices(numberHtml, priceArray);
        });
        return;
    }

    updatePrices(numberHtml);
}

async function fetchPrices(shopId, skus, customerType) {
    const rawResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: token,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            shop: shopId || false, skus, customer_type: customerType, country: 'SE'
        })
    });
    const response = await rawResponse.json();
    return response;
}

function updatePrices(nodeList, dynamicPrices) {
    nodeList.forEach((numberNode) => {
        const number = numberNode;
        const itemWrapper = number.closest('.rec_item_${dyVariationId}');
        if (dynamicPrices && Array.isArray(dynamicPrices)) {
            const sku = number.getAttribute('data-dy-sku');
            const dynamicPrice = dynamicPrices.find((price) => price.sku === sku);
            if (dynamicPrice) {
                updatePriceElement(dynamicPrice.final_price, number);

                const isConfigurable = !(sku in dynamicPrice.availability);
                if (!isConfigurable && !dynamicPrice.availability[sku]) {
                    itemWrapper.remove();
                    return;
                }

                if (dynamicPrice.regular_price !== dynamicPrice.final_price) {
                    itemWrapper.classList.add('has-discount');
                    const oldPriceNode = number.getAttribute('data-price-old');
                    
                    if (oldPriceNode) {
                      const productUspElem = itemWrapper.querySelector('.product-usp-element');
                      number.classList.add('visible');
                      updatePriceElement(dynamicPrice.regular_price, number);
                      productUspElem.setAttribute('data-usp', 'percent-discount');
                      productUspElem.setAttribute('data-x-value', dynamicPrice.discount_percentage);
                      
                      if (dynamicPrice.discount_end_date) {
                        const productMessage = itemWrapper.querySelector('.dy-recommendation-product__detail_message');
                        productMessage.style.display = 'flex';
                        productMessage.innerHTML = 'Priset gäller tom ' + dynamicPrice.discount_end_date; 
                      }
                    }
                }
            }
        }
    });

    setUspText();
    splitPrice();

    if (slider !== null) {
        slider.update();
    }
    
}

function updatePriceElement(price, elementNode) {
    elementNode.dataset.price = price;
}

function getCookie(name) {
    const cookie = {};
    document.cookie.split(';').forEach((el) => {
        const [k, v] = el.split('=');
        cookie[k.trim()] = v;
    });
    return cookie[name];
}

function getCustomerType() {
    const customerType = getCookie('customer-type');
    return !customerType || customerType === '0' ? 0 : 1;
}

function getShopId() {
    return getCookie('selected_shop');
}

function bindAddToCart() {
    let addToCartButtons = container.querySelectorAll('.dy-recommendation-product .add-to-cart');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            handleAddToCart(button);
        });
    });
}

function handleAddToCart(button) {
    var product = button.closest('.dy-recommendation-product'),
        uenc = strtr(btoa(window.location.href), '+/=', '-_,'),
        formKey = getCookie('form_key'),
        selectedStore = getCookie('selected_shop'),
        parentId = product.getAttribute('data-parent-id'),
        url = product.getAttribute('href'),
        superAttributeString = url.substring(url.indexOf('#') + 1),
        superAttributePairs = superAttributeString.split('&'),
        targetUrl = addToCartBaseUrl + 'uenc/' + uenc + '/product/' + parentId + '/',
        data = {
            product: parentId,
            selected_configurable_option: '',
            related_product: '',
            item: parentId,
            form_key: formKey,
            qty: 1
        };

    if (url.indexOf('#') !== -1) {
        superAttributePairs.forEach(function (pair) {
            let pairArray = pair.split('=');

            data['super_attribute[' + pairArray[0] + ']'] = pairArray[1];
        });
    }

    if (!selectedStore) {
      return window.dispatchEvent(new CustomEvent('open-store-switcher-modal', {
        detail: {
          postParams: JSON.stringify(data)
        }
      }));
    }
        
    doFetch(targetUrl, getFormData(data), button);
}

async function doFetch(targetUrl, formData, button)
{
    button.innerHTML = 'Lägger till...';

    const rawResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
        },
        cache: 'no-cache',
        body: new URLSearchParams(formData)
    }).then(function(response) {
        return response.json();
    }).then(function(response) {
        window.dispatchEvent(new CustomEvent('${Add To Cart DY Action Method}'));

        if ('isSuccessProductAddToCart' in response && response.isSuccessProductAddToCart !== false) {
            if (typeof window.dispatchCartMessage !== 'undefined') {
              window.dispatchCartMessage({
                  type: 'success',
                  text: response.message
              });
            }
          
            if (typeof(dataLayer) !== 'undefined' && 'eventPush' in response) {
                dataLayer.push(response['eventPush']);
            }
        }

        if ('dyPushes' in response) {
            response.dyPushes.forEach(function(dyPush) {
                let cartSuccessEvent = new CustomEvent('addToCartSuccess', {'detail' : {'dyPush': dyPush }});
                window.dispatchEvent(cartSuccessEvent);
            });
        }

        button.innerHTML = 'Lägg i varukorg';
    }).catch(function (error) {
        console.log('error');
        console.log(error);
    });
}

function strtr(str, tokens) {
    for (const i in tokens) {
        str = str.split(i).join(tokens[i]);
    }

    return str;
}

function getFormData(object) {
    const formData = new FormData();
    Object.keys(object).forEach(key => formData.append(key, object[key]));
    return formData;
}

if (typeof window.tpEventToDL !== 'function') {
  window.tpEventToDL = function(eventName, campaignID, e) {
    
    var tpLastLevelCategory = document.querySelectorAll('.breadcrumbs li')[document.querySelectorAll('.breadcrumbs li').length-2]?.innerText.trim().replace(/['"]/g, "");

    
    console.log('DY Rec', eventName, campaignID);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      campaignID: campaignID,
      campaignCategory: tpLastLevelCategory
    });
    typeof DY.API === 'function' ? DY.API("event", {name: "PDP Recommendation Click"}) : '';
    if(e === 'a2c'){
		  typeof DY.API === 'function' ? DY.API("event", {name: "PDP Recommendation A2C"}) : '';
	  }
	  
  };
}
//Window variable for ab test purposes
window.tpRecommendImp = true;
typeof DY.API === 'function' ? DY.API("event", {name: "PDP Recommendation Impression"}) : '';
