var SCREEN_WIDTH = window.innerWidth;
var container = document.getElementById('dy-recommendations-${dyVariationId}');
var INJECTED_PRODUCTS = [].slice.call(container.querySelectorAll('.dy-recommendation-product')).length;

let itemCount = 0;

// Direct API endpoint 
const baseUrl = window.location.origin;
const endpoint = baseUrl + '/rest/V1/bmx_products/getProductDataByShop';
const token = atob('QmVhcmVyIGVoZG41ZWVvdDc2bHIyMmp1MWR1ZnVnMG16OGNrYXlo');

const addToCartBaseUrl = baseUrl + '/checkout/cart/add/';

var slider = null;


// Dynamic Yield Swatches Implementation
class DySwatchStateManager {
    constructor() {
        this.productStates = new Map(); // productId -> { selectedValues, productIndex }
    }

    getProductState(productId) {
        if (!this.productStates.has(productId)) {
            this.productStates.set(productId, {
                selectedValues: {},
                productIndex: null
            });
        }
        return this.productStates.get(productId);
    }

    updateProductState(productId, selectedValues, productIndex) {
        const state = this.getProductState(productId);
        state.selectedValues = { ...selectedValues };
        state.productIndex = productIndex;
        this.productStates.set(productId, state);
    }

    getSelectedValues(productId) {
        return this.getProductState(productId).selectedValues;
    }

    getProductIndex(productId) {
        return this.getProductState(productId).productIndex;
    }
}

const swatchStateManager = new DySwatchStateManager();

class DySwatchUtils {
    static mapSwatchTypeNumberToTypeCode(typeNumber) {
        switch ("" + typeNumber) {
            case "1":
                return "color";
            case "2":
                return "image";
            case "3":
                return "empty";
            case "0":
            default:
                return "text";
        }
    }

    static getSwatchType(swatchConfig, attributeId, optionId) {
        const config = swatchConfig[attributeId];
        if (!config) return "text";

        if (config[optionId] && typeof config[optionId].type !== 'undefined') {
            return this.mapSwatchTypeNumberToTypeCode(config[optionId].type);
        }

        for (const optId in config) {
            const option = config[optId];
            if (typeof option.type !== 'undefined') {
                return this.mapSwatchTypeNumberToTypeCode(option.type);
            }
        }

        return "text";
    }

    static isTextSwatch(swatchConfig, attributeId, optionId) {
        return this.getSwatchType(swatchConfig, attributeId, optionId) === 'text';
    }

    static getSwatchBackgroundStyle(swatchConfig, attributeId, optionId) {
        const config = this.getSwatchConfig(swatchConfig, attributeId, optionId);
        const type = this.getSwatchType(swatchConfig, attributeId, optionId);

        if (!config) return '';

        if (type === 'color') {
            let hexCodes = config.value.split(';').slice(0, 2);

            if (hexCodes.length === 1) {
                return 'background-color:' + hexCodes[0];
            }

            return 'background: linear-gradient(45deg, ' + hexCodes[0] + ' 50%, ' + hexCodes[1] + ' 50%);';
        } else if (type === "image") {
            return 'background: #ffffff url(' + config.value + ') no-repeat center; background-size: cover;';
        }

        return '';
    }

    static getSwatchText(swatchConfig, configurableOptions, attributeId, optionId) {
        const config = this.getSwatchConfig(swatchConfig, attributeId, optionId);
        if (config && (config.label || config.value)) {
            return config.label || config.value;
        }

        // Fallback to option config
        if (configurableOptions.attributes && configurableOptions.attributes[attributeId]) {
            const option = configurableOptions.attributes[attributeId].options.find(opt => opt.id == optionId);
            return option ? option.label : '';
        }

        return '';
    }

    static getSwatchConfig(swatchConfig, attributeId, optionId) {
        return swatchConfig[attributeId] && swatchConfig[attributeId][optionId] 
            ? swatchConfig[attributeId][optionId] 
            : null;
    }
}

class DySwatchManager {
    constructor(productElement, baseUrl, data) {
        this.productElement = productElement;
        this.data = data;
        this.baseUrl = baseUrl;
        this.productId = this.getProductId();
        this.swatchesWrapper = productElement.querySelector('.dy-swatches-wrapper');
        this.addToCartButton = productElement.querySelector('.add-to-cart');

        this.syncWithSharedState();
    }

    getProductId() {
        const parentId = this.productElement.getAttribute('data-parent-id');
        return parentId || this.productElement.getAttribute('data-product-id') || 'unknown';
    }

    get selectedValues() {
        return swatchStateManager.getSelectedValues(this.productId);
    }

    get productIndex() {
        return swatchStateManager.getProductIndex(this.productId);
    }

    set selectedValues(values) {
        swatchStateManager.updateProductState(this.productId, values, this.productIndex);
    }

    set productIndex(index) {
        const currentValues = this.selectedValues;
        swatchStateManager.updateProductState(this.productId, currentValues, index);
    }

    syncWithSharedState() {
        this.updateSwatchUI();
        this.updateAddToCartState();

        if (this.productIndex) {
            this.syncProductImage();
        }
    }

    syncAllInstances() {
        container.querySelectorAll('.dy-recommendation-product').forEach(productEl => {
            if (productEl.swatchManager && productEl.swatchManager.productId === this.productId) {
                productEl.swatchManager.syncWithSharedState();
            }
        });
    }

    render() {
        if (!this.shouldRenderSwatches()) {
            return;
        }

        this.findAllowedAttributeOptions();
        this.renderSwatchAttributes();
        this.updateAddToCartState();
    }

    shouldRenderSwatches() {
        return this.data.swatchesConfig && 
               this.data.configurableOptions && 
               this.data.configurableOptions.attributes &&
               Object.keys(this.data.swatchesConfig).length > 0;
    }

    findAllowedAttributeOptions() {
        const allAttributes = this.data.configurableOptions.attributes;

        this.allowedAttributeOptions = [];

        for (const attributeId in allAttributes) {
            const attribute = allAttributes[attributeId];
            this.allowedAttributeOptions[attributeId] = attribute.options.filter(option => {
                return option.products && option.products.length > 0;
            });
        }
    }

    renderSwatchAttributes() {
        if (!this.swatchesWrapper) {
            return
        };

        const allAttributes = this.data.configurableOptions.attributes;
        const swatchAttributes = Object.values(allAttributes).filter(attr => 
            this.data.swatchesConfig[attr.id]
        );

        if (swatchAttributes.length === 0) {
            return
        };

        let html = '<div class="dy-swatch-attribute">';
        html += '<div class="dy-swatch-attribute-options">';
        html += '<div class="dy-swatch-options-container" role="radiogroup" aria-label="' + swatchAttributes[0].label + '">';

        swatchAttributes.forEach(attribute => {
            const allowedOptions = this.allowedAttributeOptions[attribute.id] || [];
            const visibleOptions = allowedOptions.slice(0, 7); // Show max 7 options
            const hiddenCount = Math.max(0, allowedOptions.length - 7);

            visibleOptions.forEach(option => {
                html += this.renderSwatchOption(attribute, option);
            });

            if (hiddenCount > 0) {
                html += this.renderExtraSwatchIndicator(hiddenCount);
            }
        });

        html += '</div>';
        html += '</div>';
        html += '</div>';

        this.swatchesWrapper.innerHTML = html;
        this.bindEvents();
    }

    renderSwatchOption(attribute, option) {
        const attributeId = attribute.id;
        const optionId = option.id;
        const isSelected = this.selectedValues[attributeId] == optionId;
        const isTextSwatch = DySwatchUtils.isTextSwatch(this.data.swatchesConfig, attributeId, optionId);
        const backgroundStyle = DySwatchUtils.getSwatchBackgroundStyle(this.data.swatchesConfig, attributeId, optionId);
        const swatchText = DySwatchUtils.getSwatchText(this.data.swatchesConfig, this.data.configurableOptions, attributeId, optionId);

        const activeClass = isSelected ? ' dy-active-swatch' : '';
        const sizeClass = isTextSwatch ? '' : ' dy-visual-swatch';

        return '<div class="dy-option-item' + activeClass + '" data-attribute-id="' + attributeId + '" data-option-id="' + optionId + '">' +
            '<div class="dy-outer-wrap">' +
                '<div class="dy-inner-wrap">' +
                    '<label class="dy-swatch-option' + sizeClass + '" style="' + backgroundStyle + ';">' +
                        '<input type="radio" ' +
                               'class="dy-swatch-input" ' +
                               'name="super_attribute_' + attributeId + '" ' +
                               'value="' + optionId + '"' +
                               'required' +
                               (isSelected ? ' checked' : '') + ' ' +
                               'aria-label="' + swatchText + '">' +
                        (isTextSwatch ? '<div class="dy-swatch-text">' + swatchText + '</div>' : '') +
                    '</label>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    renderExtraSwatchIndicator(count) {
        return '<div class="dy-extra-swatch-trigger">' +
            '<div class="dy-outer-wrap">' +
                '<div class="dy-inner-wrap">' +
                    '<div class="dy-swatch-option dy-extra-swatch">' +
                        '<span>+</span>' +
                        '<span class="dy-extra-count">' + count + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    bindEvents() {
        const options = this.swatchesWrapper.querySelectorAll('.dy-option-item');

        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const attributeId = option.dataset.attributeId;
                const optionId = option.dataset.optionId;
                this.changeOption(attributeId, optionId);
            });
        });

        const extraTrigger = this.swatchesWrapper.querySelector('.dy-extra-swatch-trigger');

        if (extraTrigger) {
            extraTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Navigate to product page for more options
                const productUrl = this.productElement.getAttribute('href');
                if (productUrl) {
                    window.open(productUrl, '_blank');
                }
            });
        }
    }

    changeOption(attributeId, optionId) {
        if (this.selectedValues[attributeId] == optionId) {
            delete this.selectedValues[attributeId];
        } else {
            this.selectedValues[attributeId] = optionId;
        }

        this.findSimpleIndex();
        this.updateSwatchUI();
        this.updateGallery();
        this.updateAddToCartState();
        
        // Sync all instances of this product across the slider
        this.syncAllInstances();
    }

    findSimpleIndex() {
        const productIndexes = this.data.configurableOptions.index;

        this.productIndex = Object.keys(productIndexes).find(productIndex => {
            const productCandidateOptions = productIndexes[productIndex];

            for (const productOption in productCandidateOptions) {
                if (!this.selectedValues[productOption] || 
                    this.selectedValues[productOption] != productCandidateOptions[productOption]) {
                    return false;
                }
            }
            return true;
        });
    }

    updateSwatchUI() {
        const options = this.swatchesWrapper.querySelectorAll('.dy-option-item');

        options.forEach(option => {
            const attributeId = option.dataset.attributeId;
            const optionId = option.dataset.optionId;
            const isSelected = this.selectedValues[attributeId] == optionId;

            if (isSelected) {
                option.classList.add('dy-active-swatch');
                option.querySelector('input').checked = true;
            } else {
                option.classList.remove('dy-active-swatch');
                option.querySelector('input').checked = false;
            }
        });
    }

    updateGallery() {
        if (!this.productIndex) {
            return
        };

        const productId = this.productIndex;

        fetch(this.baseUrl + '/catalog/ajax/getcustomstockpricelist?product_id=' + productId + '&isAjax=true', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.errors) {
                console.warn('Gallery update errors:', data.errors);
            } else {
                const image = data && data.medium;
                if (image) {
                    this.updateProductImage(image);
                }
            }
        })
        .catch(error => {
            console.warn('Gallery update failed:', error);
        });
    }

    updateProductImage(imageUrl) {
        const productImage = this.productElement.querySelector('.dy-recommendation-product__image');
        if (productImage && imageUrl) {
            productImage.src = imageUrl;
        }
    }

    syncProductImage() {
        // Get the current product index from shared state
        const currentProductIndex = this.productIndex;
        if (!currentProductIndex) return;

        // Fetch the image for this product index and update
        fetch(this.baseUrl + '/catalog/ajax/getcustomstockpricelist?product_id=' + currentProductIndex + '&isAjax=true', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.errors) {
                console.warn('Image sync errors:', data.errors);
            } else {
                const image = data && data.medium;
                if (image) {
                    this.updateProductImage(image);
                }
            }
        })
        .catch(error => {
            console.warn('Image sync failed:', error);
        });
    }

    updateAddToCartState() {
        if (!this.addToCartButton) return;

        const selectedProduct = this.getSelectedChildProduct();
        
        if (!selectedProduct) {
            this.addToCartButton.removeAttribute('data-selected-product-id');
            this.addToCartButton.removeAttribute('data-selected-sku');
        } else {
            this.addToCartButton.setAttribute('data-selected-product-id', selectedProduct.child_id);
            this.addToCartButton.setAttribute('data-selected-sku', selectedProduct.child_sku);
        }
    }

    getSelectedChildProduct() {
        if (Object.keys(this.selectedValues).length === 0) {
            return null;
        }

        return this.data.childProductsMapping.find(child => {
            return Object.entries(this.selectedValues).every(([attrId, optionId]) => {
                return child.attribute_values[attrId] == optionId;
            });
        });
    }
}

function renderSaleDrivenUsps(productEl) {
    const uspWrapper = productEl.querySelector('.sale-driven-usp-elements-wrapper');
    const uspDataAttr = productEl.getAttribute('data-sale-driven-usp');

    if (uspWrapper && uspDataAttr) {
        try {
            const uspData = JSON.parse(uspDataAttr);
            const elements = uspData.elements || [];
            const values = uspData.values || [];

            let uspHtml = '';
            elements.forEach((element, i) => {
                if (values[i]) {
                    uspHtml += '<div class="sale-driven-usp-wrapper">' +
                        '<div class="sale-driven-usp-element" ' +
                             'data-element="balloon" ' +
                             'data-balloon-size="balloon-small" ' +
                             'data-balloon-text="' + element + '" ' +
                             'data-pdp-balloon="true" ' +
                             'data-plp-balloon="true">' +
                            values[i] +
                        '</div>' +
                    '</div>';
                }
            });
            uspWrapper.innerHTML = uspHtml;
        } catch (e) {
            console.error('Error parsing USP data:', e);
        }
    }
}

function renderQualityIcons(productEl) {
    const iconsWrapper = productEl.querySelector('.quality-icons');
    const iconsDataAttr = productEl.getAttribute('data-quality-icons');

    if (iconsWrapper && iconsDataAttr) {
        try {
            const qualityIcons = JSON.parse(iconsDataAttr);

            let iconsHtml = '';

            qualityIcons.forEach(iconData => {
                  iconsHtml += '<div class="quality-icon quality-icon--' + iconData.icon + '" title="' + iconData.icon + '">' +
                      '<img src="' + iconData.icon_url + '" alt="' + iconData.icon + '" />' +
                  '</div>';
              });

            iconsWrapper.innerHTML = iconsHtml;
        } catch (e) {
            console.error('Error parsing quality icons data:', e);
        }
    }
}

function renderOnlineAvailability(productEl) {
    const isWebProductAttr = productEl.getAttribute('data-is-web-product');
    const onlineAvailabilityWrapper = productEl.querySelector('.online-availability-wrapper');

    if (onlineAvailabilityWrapper && isWebProductAttr === 'true') {
        onlineAvailabilityWrapper.style.display = 'block';
    }
}

function renderEnergyLabels(productEl) {
    const energyDataAttr = productEl.getAttribute('data-energy-data');
    const energyWrapper = productEl.querySelector('.energy-class');

    if (energyWrapper && energyDataAttr) {
        try {
            const energyData = JSON.parse(energyDataAttr);

            if (energyData && energyData.energy_label_code) {
                let energyHtml = '<div class="energy-label-wrapper">';

                if (energyData.energy_sheet_url) {
                    energyHtml += '<a onclick="event.stopPropagation();" href="' + energyData.energy_sheet_url + '" target="_blank" class="energy-link gtm-exclude">';
                }

                if (energyData.is_new_label) {
                    energyHtml += '<div class="energy-label gtm-exclude energy-label--new">' +
                        '<span class="energy-code gtm-exclude new" data-energy-label="' + energyData.energy_label_code + '"></span>' +
                    '</div>';
                } else {
                    energyHtml += '<div class="energy-label gtm-exclude" data-energy-label="' + energyData.energy_label_code + '" data-energy-class="' + energyData.energy_class_for_old_label + '" style="display: none;">' +
                        '<span class="energy-code"></span>' +
                    '</div>';
                }

                if (energyData.energy_sheet_url) {
                    energyHtml += '</a>';
                }

                if (energyData.energy_pdf) {
                    energyHtml += '<a onclick="event.stopPropagation();" href="' + energyData.energy_pdf + '" target="_blank" class="energy-pdf-link gtm-exclude">' +
                        'Produktinfo' +
                    '</a>';
                }

                energyHtml += '</div>';
                energyWrapper.innerHTML = energyHtml;
            }
        } catch (e) {
            console.error('Error parsing energy data:', e);
        }
    }
}

function renderBrokenPaintMarker(productEl) {
    const isBrokenPaintAttr = productEl.getAttribute('data-is-broken-paint');
    const brokenPaintMarker = productEl.querySelector('.broken-paint-marker');

    if (brokenPaintMarker && isBrokenPaintAttr === 'true') {
        brokenPaintMarker.style.display = 'flex';
    }
}

function renderPreblendRgb(productEl) {
    const preblendRgb = productEl.getAttribute('data-preblend-rgb');
    const preblendRgbWrapper = productEl.querySelector('.dy-preblend-rgb');

    if (preblendRgbWrapper && preblendRgb) {
        preblendRgbWrapper.style.display = 'block';
    }
}

function renderDynamicContent() {
    [].slice.call(container.querySelectorAll('.dy-recommendation-product')).forEach(function(productEl) {
        renderSaleDrivenUsps(productEl);
        renderQualityIcons(productEl);
        renderOnlineAvailability(productEl);
        renderEnergyLabels(productEl);
        renderBrokenPaintMarker(productEl);
        renderPreblendRgb(productEl);

        renderSwatches(productEl);
    });
}

renderDynamicContent();
setResponsiveAttributes();
parsePriceHtml('.rec_item_${dyVariationId} .rec_price_num');
processEnergyLabels();
bindAddToCart();
hidePackageUnits();

function renderSwatches(productElement) {
    try {
        const swatchesConfig = JSON.parse(productElement.dataset.swatchesConfig || '{}');
        const configurableOptions = JSON.parse(productElement.dataset.configurableOptions || '{}');
        const childProductsMapping = JSON.parse(productElement.dataset.childProductsMapping || '[]');
        const isSingleOption = productElement.dataset.isSingleOption == 'true';

        if (Object.keys(swatchesConfig).length === 0 || !isSingleOption) {
            return;
        }

        const swatchManager = new DySwatchManager(productElement, baseUrl, {
            swatchesConfig,
            configurableOptions,
            childProductsMapping
        });

        swatchManager.render();

        productElement.swatchManager = swatchManager;
    } catch (error) {
        console.warn('Failed to initialize swatches for product:', error);
    }
}

function hidePackageUnits() {
    let excludedUnits = ['st', 'stk', 'kpl', 'stk'];

    [].slice.call(container.querySelectorAll('.rec_price_package')).forEach(function (packageUnit) {
        let unitValue = packageUnit.textContent.replace('/', '');
        if (excludedUnits.includes(unitValue)) {
            packageUnit.innerHTML = '&nbsp;';
        }
    });
}

function processEnergyLabels() {
    // process old labels (with data attributes)
    [].slice.call(container.querySelectorAll('.energy-label[data-energy-label]')).forEach(function (energyLabel) {
        const energyCode = energyLabel.getAttribute('data-energy-label');
        const energyClass = energyLabel.getAttribute('data-energy-class');
        const span = energyLabel.querySelector('.energy-code');

        if (!energyCode) {
            return
        }

        const plusCount = (energyCode.match(/\+/g) || []).length;
        const cleanCode = energyCode.replace(/\+/g, '');

        if (plusCount > 0) {
            span.classList.add('plus-' + plusCount);
        }

        span.textContent = cleanCode;

        energyLabel.classList.add('energy-label--class-' + energyCode.toLowerCase());

        if (energyClass) {
            energyLabel.classList.add('energy-label--class-' + energyClass);
        }

        energyLabel.style.display = 'block';
    });

    // process new labels (energy-label--new)
    [].slice.call(container.querySelectorAll('.energy-label.energy-label--new')).forEach(function (energyLabel) {
        const span = energyLabel.querySelector('.energy-code');

        if (!span) {
            return
        }

        const energyCode = span.getAttribute('data-energy-label');

        if (!energyCode) {
            return
        }

        const energyClass = energyCode.toLowerCase().replaceAll('+', '') + 'new';
        span.classList.add(energyClass);

        span.classList.add('bg-contain', 'bg-no-repeat', 'bg-right');
    });
}

function setUspText() {
    [].slice.call(container.querySelectorAll('.product-usp-element')).forEach(function (balloon) {
        // Default case
        let result = balloon.getAttribute('data-usp'),
            useMap = true;

        // Percent discount
        if (result === 'percent-discount' || result === 'Percent Discount (x%)') {
            result = '<strong>' + balloon.getAttribute('data-x-value') + '%</strong>';
            useMap = false;
            balloon.style.display = 'flex';
            balloon.classList.add('percent-discount');

            balloon.innerHTML = balloon.innerHTML + '<span class="bubble-text">' + result + '</span>';
        }
    });
    //DY event for content loaded in PDP recommendation
    typeof DY.API === 'function' ? DY.API("event", { name: "PDP Rec Updated" }) : '';
}

function splitPrice() {
    [].slice.call(container.querySelectorAll('.dy-recommendation-product__detail--price'))
        .forEach(function (el) {
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
                parsedPrice = parsedPrice.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1' + ' ');
            }

            el.querySelectorAll('.integer')[0].textContent = parsedPrice;
        });
}

initSlider().then(function () {
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

    settings.forEach(function (item) {
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
    if (SCREEN_WIDTH <= '${Breakpoint Mobile}' && INJECTED_PRODUCTS > ITEMS_TO_DISPLAY_MOBILE ||
        SCREEN_WIDTH > '${Breakpoint Mobile}' && SCREEN_WIDTH <= '${Breakpoint Tablet}' && INJECTED_PRODUCTS > ITEMS_TO_DISPLAY_TABLET ||
        SCREEN_WIDTH > '${Breakpoint Tablet}' && SCREEN_WIDTH <= '${Breakpoint Desktop}' && INJECTED_PRODUCTS > ITEMS_TO_DISPLAY_DESKTOP ||
        SCREEN_WIDTH > '${Breakpoint Desktop}' && INJECTED_PRODUCTS > ITEMS_TO_DISPLAY_XL) {
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
        containerModifierClass: 'dy-recommendations__slider-',
        on: {
            init: function() {
                setTimeout(() => {
                    container.querySelectorAll('.dy-recommendation-product').forEach(productEl => {
                        if (!productEl.swatchManager) {
                            renderSwatches(productEl);
                        } else {
                            productEl.swatchManager.syncWithSharedState();
                        }
                    });
                }, 100);
            }
        }
    };
}

function appendJSFile(url) {
    return DYO.Q.Promise(function (resolve, reject) {
        if (typeof define === 'function' && define.amd) {
            require([url], function (swiper) {
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
    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: token
    };

    try {
        const rawResponse = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                shop: shopId || false, skus, customer_type: customerType, country: 'SE'
            })
        });

        if (!rawResponse.ok) {
            throw new Error('HTTP error! status: ' + rawResponse.status);
        }

        const responseText = await rawResponse.text();

        if (!responseText) {
            throw new Error('Empty response received');
        }

        const response = JSON.parse(responseText);

        return response;
    } catch (error) {
        console.error('fetchPrices error:', error);
        console.error('Endpoint:', endpoint);
        console.error('Headers:', headers);
        throw error;
    }
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

                // Update ARIA label for current price
                const currentPriceLabel = 'Price ' + formatPriceForAria(dynamicPrice.final_price);
                number.setAttribute('aria-label', currentPriceLabel);

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
                        
                        const oldPriceLabel = 'Original Price ' + formatPriceForAria(dynamicPrice.regular_price);
                        number.setAttribute('aria-label', oldPriceLabel);
                        
                        productUspElem.setAttribute('data-usp', 'percent-discount');
                        productUspElem.setAttribute('data-x-value', dynamicPrice.discount_percentage);

                        if (dynamicPrice.discount_end_date) {
                            const productMessage = itemWrapper.querySelector('.dy-recommendation-product__detail_message');
                            const endDateElement = productMessage.querySelector('.end-date');
                            
                            productMessage.style.display = 'flex';
                            endDateElement.textContent = dynamicPrice.discount_end_date;
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

// Helper function to format price for ARIA labels
function formatPriceForAria(price) {
    if (typeof price === 'number') {
        return price.toFixed(2);
    }
    return price.toString();
}

function updatePriceElement(price, elementNode) {
    elementNode.dataset.price = price;
    
    // Update ARIA label when price changes
    const isOldPrice = elementNode.getAttribute('data-price-old');
    const priceLabel = isOldPrice ? 
        'Original Price ' + formatPriceForAria(price) : 
        'Price ' + formatPriceForAria(price);
    elementNode.setAttribute('aria-label', priceLabel);
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
    const forms = document.querySelectorAll('.dy-recommendation-product-container');

    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.stopPropagation();
            event.preventDefault();

            if (form.checkValidity()) {
                const button = form.querySelector('.add-to-cart');

                handleAddToCart(button);
            } else {
                form.reportValidity();
            }
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

    const selectedProductId = button.getAttribute('data-selected-product-id');

    if (selectedProductId) {
        data.product = selectedProductId;
        data.item = selectedProductId;

        const swatchManager = product.swatchManager;

        if (swatchManager && swatchManager.selectedValues) {
            Object.entries(swatchManager.selectedValues).forEach(([attributeId, optionId]) => {
                data['super_attribute[' + attributeId + ']'] = optionId;
            });
        }
    }

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

async function doFetch(targetUrl, formData, button) {
    button.innerHTML = 'Lägger till...';

    const rawResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
        },
        cache: 'no-cache',
        body: new URLSearchParams(formData)
    }).then(function (response) {
        return response.json();
    }).then(function (response) {
        window.dispatchEvent(new CustomEvent('${Add To Cart DY Action Method}'));

        if ('isSuccessProductAddToCart' in response && response.isSuccessProductAddToCart !== false) {
            if (typeof window.dispatchCartMessage !== 'undefined') {
                window.dispatchCartMessage({
                    type: 'success',
                    text: response.message
                });
            }

            if (typeof (dataLayer) !== 'undefined' && 'eventPush' in response) {
                dataLayer.push(response['eventPush']);
            }
        }

        if ('dyPushes' in response) {
            response.dyPushes.forEach(function (dyPush) {
                let cartSuccessEvent = new CustomEvent('addToCartSuccess', { 'detail': { 'dyPush': dyPush } });
                window.dispatchEvent(cartSuccessEvent);
            });
        }

        button.innerHTML = 'Lägg i varukorg';
    }).catch(function (error) {
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
    window.tpEventToDL = function (eventName, campaignID, e) {
        var tpLastLevelCategory = document.querySelectorAll('.breadcrumbs li')[document.querySelectorAll('.breadcrumbs li').length - 2]?.innerText.trim().replace(/['"]/g, "");

        console.log('DY Rec', eventName, campaignID);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: eventName,
            campaignID: campaignID,
            campaignCategory: tpLastLevelCategory
        });
        typeof DY.API === 'function' ? DY.API("event", { name: "PDP Recommendation Click" }) : '';
        if (e === 'a2c') {
            typeof DY.API === 'function' ? DY.API("event", { name: "PDP Recommendation A2C" }) : '';
        }

    };
}
//Window variable for ab test purposes
window.tpRecommendImp = true;
typeof DY.API === 'function' ? DY.API("event", { name: "PDP Recommendation Impression" }) : '';
