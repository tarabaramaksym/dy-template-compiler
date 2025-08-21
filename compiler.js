const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const express = require('express');
const mustache = require('mustache');
const config = require('./config');
const { execSync } = require('child_process');

class TemplateCompiler {
  constructor() {
    this.app = express();
    this.port = 3000;
    this.outputDir = path.join(__dirname, 'dist');
    this.fontsDir = path.join(this.outputDir, 'fonts');
    this.locale = config.locale || 'en';
    this.setupServer();
    this.loadTestData();
  }

  runTranslator() {
    try {
      console.log('🔄 Running translator script...');
      execSync('node translator.js', { 
        cwd: __dirname, 
        stdio: 'inherit' 
      });
      console.log('✅ Translation completed');
    } catch (error) {
      console.error('❌ Translation failed:', error.message);
    }
  }

  copyFonts() {
    try {
      // Ensure fonts directory exists
      if (!fs.existsSync(this.fontsDir)) {
        fs.mkdirSync(this.fontsDir, { recursive: true });
      }

      // Define the fonts that are referenced in the typography SCSS
      const requiredFonts = [
        'Trim-Light.woff2', 'Trim-Light.woff', 'Trim-Light.ttf', 'Trim-Light.otf',
        'Trim-Bold.woff2', 'Trim-Bold.woff', 'Trim-Bold.ttf', 'Trim-Bold.otf',
        'Trim-Medium.woff2', 'Trim-Medium.woff', 'Trim-Medium.ttf', 'Trim-Medium.otf',
        'ByggmaxHandwrite.woff', 'ByggmaxHandwrite.otf',
        'Mikro-Regular.woff2', 'Mikro-Regular.woff', 'Mikro-Regular.ttf', 'Mikro-Regular.otf',
        'Mikro-Bold.woff2', 'Mikro-Bold.woff', 'Mikro-Bold.ttf', 'Mikro-Bold.otf',
        'Mikro-Black.woff2', 'Mikro-Black.woff', 'Mikro-Black.ttf', 'Mikro-Black.otf',
        'Mulish-Light.woff2', 'Mulish-Light.woff', 'Mulish-Light.ttf', 'Mulish-Light.otf',
        'Mulish-Regular.woff2', 'Mulish-Regular.woff', 'Mulish-Regular.ttf', 'Mulish-Regular.otf',
        'Mulish-Bold.woff2', 'Mulish-Bold.woff', 'Mulish-Bold.ttf', 'Mulish-Bold.otf',
        'Mulish-Black.woff2', 'Mulish-Black.woff', 'Mulish-Black.ttf', 'Mulish-Black.otf',
        'Byggmax-Icons.woff', 'Byggmax-Icons.ttf'
      ];

      const sourceFontsDir = path.join(__dirname, '..', 'app', 'design', 'frontend', 'Byggmax', 'base', 'web', 'fonts');
      let copiedCount = 0;

      requiredFonts.forEach(fontFile => {
        const sourcePath = path.join(sourceFontsDir, fontFile);
        const destPath = path.join(this.fontsDir, fontFile);
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          copiedCount++;
        } else {
          console.warn(`⚠️  Font file not found: ${fontFile}`);
        }
      });

      console.log(`📁 Copied ${copiedCount} font files to ${this.fontsDir}`);
      return copiedCount;
    } catch (error) {
      console.error('❌ Error copying fonts:', error);
      return 0;
    }
  }

  getFontFaceDeclarations() {
    return `
/* Font Face Declarations */
@font-face {
    font-family: 'Trim';
    src: url('./fonts/Trim-Light.woff2') format('woff2'),
         url('./fonts/Trim-Light.woff') format('woff'),
         url('./fonts/Trim-Light.ttf') format('truetype'),
         url('./fonts/Trim-Light.otf') format('opentype');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Trim';
    src: url('./fonts/Trim-Bold.woff2') format('woff2'),
         url('./fonts/Trim-Bold.woff') format('woff'),
         url('./fonts/Trim-Bold.ttf') format('truetype'),
         url('./fonts/Trim-Bold.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Trim-Medium';
    src: url('./fonts/Trim-Medium.woff2') format('woff2'),
         url('./fonts/Trim-Medium.woff') format('woff'),
         url('./fonts/Trim-Medium.ttf') format('truetype'),
         url('./fonts/Trim-Medium.otf') format('opentype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Trim-Light';
    src: url('./fonts/Trim-Light.woff2') format('woff2'),
         url('./fonts/Trim-Light.woff') format('woff'),
         url('./fonts/Trim-Light.ttf') format('truetype'),
         url('./fonts/Trim-Light.otf') format('opentype');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Trim-Bold';
    src: url('./fonts/Trim-Bold.woff2') format('woff2'),
         url('./fonts/Trim-Bold.woff') format('woff'),
         url('./fonts/Trim-Bold.ttf') format('truetype'),
         url('./fonts/Trim-Bold.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mikro';
    src: url('./fonts/Mikro-Regular.woff2') format('woff2'),
         url('./fonts/Mikro-Regular.woff') format('woff'),
         url('./fonts/Mikro-Regular.ttf') format('truetype'),
         url('./fonts/Mikro-Regular.otf') format('opentype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mikro';
    src: url('./fonts/Mikro-Bold.woff2') format('woff2'),
         url('./fonts/Mikro-Bold.woff') format('woff'),
         url('./fonts/Mikro-Bold.ttf') format('truetype'),
         url('./fonts/Mikro-Bold.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mikro';
    src: url('./fonts/Mikro-Black.woff2') format('woff2'),
         url('./fonts/Mikro-Black.woff') format('woff'),
         url('./fonts/Mikro-Black.ttf') format('truetype'),
         url('./fonts/Mikro-Black.otf') format('opentype');
    font-weight: 900;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mikro-Regular';
    src: url('./fonts/Mikro-Regular.woff2') format('woff2'),
         url('./fonts/Mikro-Regular.woff') format('woff'),
         url('./fonts/Mikro-Regular.ttf') format('truetype'),
         url('./fonts/Mikro-Regular.otf') format('opentype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mikro-Bold';
    src: url('./fonts/Mikro-Bold.woff2') format('woff2'),
         url('./fonts/Mikro-Bold.woff') format('woff'),
         url('./fonts/Mikro-Bold.ttf') format('truetype'),
         url('./fonts/Mikro-Bold.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mikro-Black';
    src: url('./fonts/Mikro-Black.woff2') format('woff2'),
         url('./fonts/Mikro-Black.woff') format('woff'),
         url('./fonts/Mikro-Black.ttf') format('truetype'),
         url('./fonts/Mikro-Black.otf') format('opentype');
    font-weight: 800;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mulish-Light';
    src: url('./fonts/Mulish-Light.woff2') format('woff2'),
         url('./fonts/Mulish-Light.woff') format('woff'),
         url('./fonts/Mulish-Light.ttf') format('truetype'),
         url('./fonts/Mulish-Light.otf') format('opentype');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mulish-Regular';
    src: url('./fonts/Mulish-Regular.woff2') format('woff2'),
         url('./fonts/Mulish-Regular.woff') format('woff'),
         url('./fonts/Mulish-Regular.ttf') format('truetype'),
         url('./fonts/Mulish-Regular.otf') format('opentype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mulish-Bold';
    src: url('./fonts/Mulish-Bold.woff2') format('woff2'),
         url('./fonts/Mulish-Bold.woff') format('woff'),
         url('./fonts/Mulish-Bold.ttf') format('truetype'),
         url('./fonts/Mulish-Bold.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Mulish-Black';
    src: url('./fonts/Mulish-Black.woff2') format('woff2'),
         url('./fonts/Mulish-Black.woff') format('woff'),
         url('./fonts/Mulish-Black.ttf') format('truetype'),
         url('./fonts/Mulish-Black.otf') format('opentype');
    font-weight: 900;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'ByggmaxHandwrite';
    src: url('./fonts/ByggmaxHandwrite.woff') format('woff'),
         url('./fonts/ByggmaxHandwrite.otf') format('opentype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Byggmax-Icons';
    src: url('./fonts/Byggmax-Icons.woff') format('woff'),
         url('./fonts/Byggmax-Icons.ttf') format('truetype');
    font-style: normal;
    font-display: swap;
}
`;
  }

  loadTestData() {
    try {
      const testData = JSON.parse(fs.readFileSync(path.join(__dirname, 'test.json'), 'utf8'));
      // Create multiple products for testing by reusing the same product with slight variations
      this.testProducts = Array.from({ length: 12 }, (_, index) => ({
        // Original data for reference
        ...testData.feed,
        
        // Template field mappings
        id: testData.feed.id + index,
        sku: testData.feed.sku + (index > 0 ? '-' + index : ''),
        name: testData.feed.title + (index > 0 ? ` (Variant ${index + 1})` : ''),
        url: testData.feed.link,
        img_url: testData.feed.image_link,
        brand: testData.feed.brand || testData.feed.varumärke || 'Wiksbo',
        description: testData.feed.description || 'Premium kvalitet',
        price: (parseFloat(testData.feed.price_1) + (index * 100)).toFixed(2),
        sales_price: testData.feed.sales_price || null,
        dynamic_price: testData.feed.dynamic_price || '0',
        'Currency Symbol': 'kr',
        
        // USP elements (legacy single USP)
        usp_element: index === 0 ? 'New' : 
                    index === 1 ? 'Customer Favourite' :
                    index === 2 ? 'Better' :
                    index === 3 ? 'Best' :
                    index === 4 ? 'Greener Choice' : 'Good',
        usp_element_x_value: '',
        usp_element_y_value: '',
        usp_element_custom: '',
        
        // Sale-driven USP data (multiple USPs)
        sale_driven_usp_data: index === 0 ? "{\"elements\":[\"customer_favourite\",\"greener_choice\"],\"values\":[\"Kundfavorit\",\"Ett grönare val\"]}" :
                             index === 2 ? "{\"elements\":[\"greener_choice\"],\"values\":[\"Ett grönare val\"]}" :
                             index === 7 ? "{\"elements\":[\"good\"],\"values\":[\"Bra\"]}" :
                             index === 10 ? "{\"elements\":[\"good\"],\"values\":[\"Bra\"]}" : "{}",

        // Parent product ID
        'parent-id': testData.feed.parent_sku || testData.feed.item_group_id,

        // Broken paint / tint functionality (paint, stain, primer products)
        is_broken_paint: index === 0 || index === 2 || index === 8 || index === 11, // Paint/stain products
        broken_paint_type: index === 2 ? 'paint' : 
                          index === 5 ? 'stain' : 
                          index === 8 ? 'primer' : 
                          index === 11 ? 'paint' : null,

        // Quality icons data (raw data from Channable)
        quality_icons_data: index === 0 ? "[{\"icon\":\"fsc\",\"icon_url\":\"https://local.bmx2.com/static/version1755259237/frontend/Byggmax/hyva/sv_SE/images/quality-icons/fsc.svg\"},{\"icon\":\"svenmar\",\"icon_url\":\"https://local.bmx2.com/static/version1755259237/frontend/Byggmax/hyva/sv_SE/images/quality-icons/svenmar.svg\"}]" :
                           index === 1 ? "[{\"icon\":\"fsc\",\"icon_url\":\"https://local.bmx2.com/static/version1755259237/frontend/Byggmax/hyva/sv_SE/images/quality-icons/fsc.svg\"}]" :
                           index === 7 ? "[{\"icon\":\"krav\",\"icon_url\":\"https://local.bmx2.com/static/version1755259237/frontend/Byggmax/hyva/sv_SE/images/quality-icons/krav.svg\"},{\"icon\":\"bra-miljoval\",\"icon_url\":\"https://local.bmx2.com/static/version1755259237/frontend/Byggmax/hyva/sv_SE/images/quality-icons/bra-miljoval.svg\"}]" :
                           index === 10 ? "[{\"icon\":\"fsc\",\"icon_url\":\"https://local.bmx2.com/static/version1755259237/frontend/Byggmax/hyva/sv_SE/images/quality-icons/fsc.svg\"},{\"icon\":\"prisjakt\",\"icon_url\":\"https://local.bmx2.com/static/version1755259237/frontend/Byggmax/hyva/sv_SE/images/quality-icons/prisjakt.svg\"},{\"icon\":\"svensktvir\",\"icon_url\":\"https://local.bmx2.com/static/version1755259237/frontend/Byggmax/hyva/sv_SE/images/quality-icons/svensktvir.svg\"}]" : "[]",

        // Energy label data (electrical products)
        energy_label_data: index === 0 ? "{\"energy_label_code\":\"A++\",\"energy_sheet_url\":\"https://www.byggmax.se/media/energy-sheets/led-lamp-a-plus-plus.pdf\",\"is_new_label\":true,\"energy_class_for_old_label\":\"excellent\"}" :
                    index === 2 ? "{\"energy_label_code\":\"B\",\"energy_sheet_url\":null,\"energy_pdf\":\"https://www.byggmax.se/media/product-info/dishwasher-manual.pdf\",\"is_new_label\":false,\"energy_class_for_old_label\":\"good\"}" :
                    index === 6 ? "{\"energy_label_code\":\"A+++\",\"energy_sheet_url\":\"https://www.byggmax.se/media/energy-sheets/washing-machine-a-triple-plus.pdf\",\"energy_pdf\":null,\"is_new_label\":true,\"energy_class_for_old_label\":\"excellent\"}" :
                    index === 11 ? "{\"energy_label_code\":\"D\",\"energy_sheet_url\":null,\"energy_pdf\":\"https://www.byggmax.se/media/product-info/heater-installation.pdf\",\"is_new_label\":false,\"energy_class_for_old_label\":\"average\"}" : "{\"energy_label_code\":null,\"energy_sheet_url\":null,\"energy_pdf\":null,\"is_new_label\":false,\"energy_class_for_old_label\":null}",

        // Swatches configuration data (configurable products with color/size options)
        swatches_config: index === 0 ? "{\"187\":{\"167\":{\"type\":\"1\",\"value\":\"#ff0000\",\"label\":\"Röd\"},\"168\":{\"type\":\"1\",\"value\":\"#0000ff\",\"label\":\"Blå\"},\"169\":{\"type\":\"1\",\"value\":\"#00ff00\",\"label\":\"Grön\"}}}" :
                        index === 2 ? "{\"187\":{\"167\":{\"type\":\"1\",\"value\":\"#ffffff\",\"label\":\"Vit\"},\"168\":{\"type\":\"1\",\"value\":\"#000000\",\"label\":\"Svart\"},\"170\":{\"type\":\"1\",\"value\":\"#808080\",\"label\":\"Grå\"}},\"188\":{\"171\":{\"type\":\"0\",\"value\":\"S\",\"label\":\"Small\"},\"172\":{\"type\":\"0\",\"value\":\"M\",\"label\":\"Medium\"},\"173\":{\"type\":\"0\",\"value\":\"L\",\"label\":\"Large\"}}}" :
                        index === 6 ? "{\"189\":{\"174\":{\"type\":\"1\",\"value\":\"#8B4513\",\"label\":\"Brun\"},\"175\":{\"type\":\"1\",\"value\":\"#D2B48C\",\"label\":\"Beige\"},\"176\":{\"type\":\"1\",\"value\":\"#696969\",\"label\":\"Mörkgrå\"}}}" :
                        index === 9 ? "{\"187\":{\"177\":{\"type\":\"1\",\"value\":\"#FF69B4\",\"label\":\"Rosa\"},\"178\":{\"type\":\"1\",\"value\":\"#9370DB\",\"label\":\"Lila\"},\"179\":{\"type\":\"1\",\"value\":\"#FFD700\",\"label\":\"Guld\"}}}" : "{}",

        // Configurable options data (product configuration for add-to-cart)
        configurable_options: index === 0 ? "{\"attributes\":{\"187\":{\"id\":\"187\",\"code\":\"color\",\"label\":\"Färg\",\"options\":[{\"id\":\"167\",\"label\":\"Röd\",\"products\":[\"" + (testData.feed.id + index + 1000) + "\"]},{\"id\":\"168\",\"label\":\"Blå\",\"products\":[\"" + (testData.feed.id + index + 1001) + "\"]},{\"id\":\"169\",\"label\":\"Grön\",\"products\":[\"" + (testData.feed.id + index + 1002) + "\"]}]}}," +
                                         "\"index\":{\"" + (testData.feed.id + index + 1000) + "\":{\"187\":\"167\"},\"" + (testData.feed.id + index + 1001) + "\":{\"187\":\"168\"},\"" + (testData.feed.id + index + 1002) + "\":{\"187\":\"169\"}}}" :
                             index === 2 ? "{\"attributes\":{\"187\":{\"id\":\"187\",\"code\":\"color\",\"label\":\"Färg\",\"options\":[{\"id\":\"167\",\"label\":\"Vit\",\"products\":[\"" + (testData.feed.id + index + 1000) + "\",\"" + (testData.feed.id + index + 1003) + "\"]},{\"id\":\"168\",\"label\":\"Svart\",\"products\":[\"" + (testData.feed.id + index + 1001) + "\",\"" + (testData.feed.id + index + 1004) + "\"]},{\"id\":\"170\",\"label\":\"Grå\",\"products\":[\"" + (testData.feed.id + index + 1002) + "\",\"" + (testData.feed.id + index + 1005) + "\"]}]},\"188\":{\"id\":\"188\",\"code\":\"size\",\"label\":\"Storlek\",\"options\":[{\"id\":\"171\",\"label\":\"Small\",\"products\":[\"" + (testData.feed.id + index + 1000) + "\",\"" + (testData.feed.id + index + 1001) + "\",\"" + (testData.feed.id + index + 1002) + "\"]},{\"id\":\"172\",\"label\":\"Medium\",\"products\":[\"" + (testData.feed.id + index + 1003) + "\",\"" + (testData.feed.id + index + 1004) + "\",\"" + (testData.feed.id + index + 1005) + "\"]}]}}," +
                                        "\"index\":{\"" + (testData.feed.id + index + 1000) + "\":{\"187\":\"167\",\"188\":\"171\"},\"" + (testData.feed.id + index + 1001) + "\":{\"187\":\"168\",\"188\":\"171\"},\"" + (testData.feed.id + index + 1002) + "\":{\"187\":\"170\",\"188\":\"171\"},\"" + (testData.feed.id + index + 1003) + "\":{\"187\":\"167\",\"188\":\"172\"},\"" + (testData.feed.id + index + 1004) + "\":{\"187\":\"168\",\"188\":\"172\"},\"" + (testData.feed.id + index + 1005) + "\":{\"187\":\"170\",\"188\":\"172\"}}}" :
                             index === 6 ? "{\"attributes\":{\"189\":{\"id\":\"189\",\"code\":\"finish\",\"label\":\"Finish\",\"options\":[{\"id\":\"174\",\"label\":\"Brun\",\"products\":[\"" + (testData.feed.id + index + 1000) + "\"]},{\"id\":\"175\",\"label\":\"Beige\",\"products\":[\"" + (testData.feed.id + index + 1001) + "\"]},{\"id\":\"176\",\"label\":\"Mörkgrå\",\"products\":[\"" + (testData.feed.id + index + 1002) + "\"]}]}}," +
                                        "\"index\":{\"" + (testData.feed.id + index + 1000) + "\":{\"189\":\"174\"},\"" + (testData.feed.id + index + 1001) + "\":{\"189\":\"175\"},\"" + (testData.feed.id + index + 1002) + "\":{\"189\":\"176\"}}}" :
                             index === 9 ? "{\"attributes\":{\"187\":{\"id\":\"187\",\"code\":\"color\",\"label\":\"Färg\",\"options\":[{\"id\":\"177\",\"label\":\"Rosa\",\"products\":[\"" + (testData.feed.id + index + 1000) + "\"]},{\"id\":\"178\",\"label\":\"Lila\",\"products\":[\"" + (testData.feed.id + index + 1001) + "\"]},{\"id\":\"179\",\"label\":\"Guld\",\"products\":[\"" + (testData.feed.id + index + 1002) + "\"]}]}}," +
                                        "\"index\":{\"" + (testData.feed.id + index + 1000) + "\":{\"187\":\"177\"},\"" + (testData.feed.id + index + 1001) + "\":{\"187\":\"178\"},\"" + (testData.feed.id + index + 1002) + "\":{\"187\":\"179\"}}}" : "{}",

        // Child products mapping for add-to-cart functionality
        child_products_mapping: index === 0 ? "[{\"child_id\":\"" + (testData.feed.id + index + 1000) + "\",\"child_sku\":\"" + testData.feed.sku + "-red\",\"child_entity_id\":\"" + (testData.feed.id + index + 1000) + "\",\"attribute_values\":{\"187\":\"167\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":25},\"price_data\":{\"regular_price\":1299.00,\"final_price\":1299.00}},{\"child_id\":\"" + (testData.feed.id + index + 1001) + "\",\"child_sku\":\"" + testData.feed.sku + "-blue\",\"child_entity_id\":\"" + (testData.feed.id + index + 1001) + "\",\"attribute_values\":{\"187\":\"168\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":18},\"price_data\":{\"regular_price\":1299.00,\"final_price\":1299.00}},{\"child_id\":\"" + (testData.feed.id + index + 1002) + "\",\"child_sku\":\"" + testData.feed.sku + "-green\",\"child_entity_id\":\"" + (testData.feed.id + index + 1002) + "\",\"attribute_values\":{\"187\":\"169\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":12},\"price_data\":{\"regular_price\":1299.00,\"final_price\":1199.00}}]" :
                               index === 2 ? "[{\"child_id\":\"" + (testData.feed.id + index + 1000) + "\",\"child_sku\":\"" + testData.feed.sku + "-white-s\",\"child_entity_id\":\"" + (testData.feed.id + index + 1000) + "\",\"attribute_values\":{\"187\":\"167\",\"188\":\"171\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":15},\"price_data\":{\"regular_price\":899.00,\"final_price\":899.00}},{\"child_id\":\"" + (testData.feed.id + index + 1001) + "\",\"child_sku\":\"" + testData.feed.sku + "-black-s\",\"child_entity_id\":\"" + (testData.feed.id + index + 1001) + "\",\"attribute_values\":{\"187\":\"168\",\"188\":\"171\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":22},\"price_data\":{\"regular_price\":899.00,\"final_price\":899.00}},{\"child_id\":\"" + (testData.feed.id + index + 1003) + "\",\"child_sku\":\"" + testData.feed.sku + "-white-m\",\"child_entity_id\":\"" + (testData.feed.id + index + 1003) + "\",\"attribute_values\":{\"187\":\"167\",\"188\":\"172\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":8},\"price_data\":{\"regular_price\":899.00,\"final_price\":799.00}},{\"child_id\":\"" + (testData.feed.id + index + 1004) + "\",\"child_sku\":\"" + testData.feed.sku + "-black-m\",\"child_entity_id\":\"" + (testData.feed.id + index + 1004) + "\",\"attribute_values\":{\"187\":\"168\",\"188\":\"172\"},\"stock_data\":{\"is_in_stock\":false,\"qty\":0},\"price_data\":{\"regular_price\":899.00,\"final_price\":899.00}}]" :
                               index === 6 ? "[{\"child_id\":\"" + (testData.feed.id + index + 1000) + "\",\"child_sku\":\"" + testData.feed.sku + "-brown\",\"child_entity_id\":\"" + (testData.feed.id + index + 1000) + "\",\"attribute_values\":{\"189\":\"174\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":30},\"price_data\":{\"regular_price\":2199.00,\"final_price\":1999.00}},{\"child_id\":\"" + (testData.feed.id + index + 1001) + "\",\"child_sku\":\"" + testData.feed.sku + "-beige\",\"child_entity_id\":\"" + (testData.feed.id + index + 1001) + "\",\"attribute_values\":{\"189\":\"175\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":45},\"price_data\":{\"regular_price\":2199.00,\"final_price\":2199.00}},{\"child_id\":\"" + (testData.feed.id + index + 1002) + "\",\"child_sku\":\"" + testData.feed.sku + "-darkgray\",\"child_entity_id\":\"" + (testData.feed.id + index + 1002) + "\",\"attribute_values\":{\"189\":\"176\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":7},\"price_data\":{\"regular_price\":2199.00,\"final_price\":2199.00}}]" :
                               index === 9 ? "[{\"child_id\":\"" + (testData.feed.id + index + 1000) + "\",\"child_sku\":\"" + testData.feed.sku + "-pink\",\"child_entity_id\":\"" + (testData.feed.id + index + 1000) + "\",\"attribute_values\":{\"187\":\"177\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":5},\"price_data\":{\"regular_price\":1799.00,\"final_price\":1599.00}},{\"child_id\":\"" + (testData.feed.id + index + 1001) + "\",\"child_sku\":\"" + testData.feed.sku + "-purple\",\"child_entity_id\":\"" + (testData.feed.id + index + 1001) + "\",\"attribute_values\":{\"187\":\"178\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":11},\"price_data\":{\"regular_price\":1799.00,\"final_price\":1799.00}},{\"child_id\":\"" + (testData.feed.id + index + 1002) + "\",\"child_sku\":\"" + testData.feed.sku + "-gold\",\"child_entity_id\":\"" + (testData.feed.id + index + 1002) + "\",\"attribute_values\":{\"187\":\"179\"},\"stock_data\":{\"is_in_stock\":true,\"qty\":3},\"price_data\":{\"regular_price\":1799.00,\"final_price\":1799.00}}]" : "[]",

        is_single_option: index === 0 || index === 6 || index === 9,

        isWebProduct: index === 0 || index === 4 || index === 7 || index === 10,
        preblend_rgb: index === 2 ? '255,0,0' : index === 4 ? '0,0,0' : null,
        
      }));
      
      console.log(`Loaded ${this.testProducts.length} test products`);
      console.log('Sample product fields:', Object.keys(this.testProducts[0]).slice(0, 10));
    } catch (error) {
      console.error('Error loading test data:', error);
      this.testProducts = [];
    }
  }

  compileTemplate(templateContent, variables = {}) {
    // Replace ${variable} syntax with actual values, but preserve Mustache syntax
    let compiled = templateContent;
    
    // Merge config with any additional variables
    const allVars = { ...config, ...variables };
    
    // Replace all ${variable} patterns, but skip Mustache-style loops and product fields
    Object.keys(allVars).forEach(key => {
      const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
      compiled = compiled.replace(pattern, allVars[key]);
    });
    
    return compiled;
  }

  compileProductTemplate(htmlTemplate) {
    // First compile the config ${} variables
    let compiledTemplate = this.compileTemplate(htmlTemplate);
    
    // Convert ${#Recommendations} to {{#Recommendations}} for Mustache
    // Convert ${/Recommendations} to {{/Recommendations}} for Mustache
    compiledTemplate = compiledTemplate.replace(/\$\{#Recommendations\}/g, '{{#Recommendations}}');
    compiledTemplate = compiledTemplate.replace(/\$\{\/Recommendations\}/g, '{{/Recommendations}}');
    
    // USP loops are already in correct Mustache format in template
    // No conversion needed for {{#sale_driven_usp_elements}} and {{/sale_driven_usp_elements}}
    
    // Convert product field variables to Mustache format
    const productFields = [
      'url', 'img_url', 'name', 'brand', 'description', 'price', 'sales_price', 
      'dynamic_price', 'sku', 'parent-id', 'usp_element', 'usp_element_x_value', 
      'usp_element_y_value', 'usp_element_custom', 'Currency Symbol', 'is_broken_paint',
      'broken_paint_type', 'test', 'sale_driven_usp_data', 'quality_icons_data', 'isWebProduct', 'energy_label_data', 'swatches_config',
      'configurable_options', 'child_products_mapping', 'is_single_option', 'preblend_rgb'
    ];
    
    // Note: 'element' and 'value' are already in correct {{}} format in template
    
    productFields.forEach(field => {
      const pattern = new RegExp(`\\$\\{${field}\\}`, 'g');
      compiledTemplate = compiledTemplate.replace(pattern, `{{${field}}}`);
    });
    
    // Prepare data for Mustache template
    const templateData = {
      Recommendations: this.testProducts
    };
    
    // Process Mustache templates for product loops
    return mustache.render(compiledTemplate, templateData);
  }

  async compileAll() {
    try {
      console.log('Compiling templates...');
      console.log(`Using ${this.testProducts.length} test products`);
      
      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Copy fonts first
      console.log('📁 Copying fonts...');
      const fontsCopied = this.copyFonts();

      // Read template files based on locale
      const htmlTemplatePath = path.join(__dirname, 'translated_templates', `template_${this.locale}.html`);
      const jsTemplatePath = path.join(__dirname, 'translated_templates', `template_${this.locale}.js`);
      
      // Fallback to original templates if translated versions don't exist
      const htmlTemplate = fs.existsSync(htmlTemplatePath) 
        ? fs.readFileSync(htmlTemplatePath, 'utf8')
        : fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
      
      const jsTemplate = fs.existsSync(jsTemplatePath)
        ? fs.readFileSync(jsTemplatePath, 'utf8')
        : fs.readFileSync(path.join(__dirname, 'template.js'), 'utf8');
      
      const cssTemplate = fs.readFileSync(path.join(__dirname, 'template.css'), 'utf8');

      // Compile HTML with products
      console.log('Converting template syntax...');
      const compiledHtml = this.compileProductTemplate(htmlTemplate);
      
      // Compile CSS and JS (just variable replacement)
      const compiledCss = this.getFontFaceDeclarations() + '\n' + this.compileTemplate(cssTemplate);
      const compiledJs = this.compileTemplate(jsTemplate);

      // Debug: Save intermediate files for inspection
      fs.writeFileSync(path.join(this.outputDir, 'debug-template.html'), compiledHtml.substring(0, 1000) + '...');
      console.log('Saved debug template preview (first 1000 chars)');

      // Create full HTML page for testing
      const fullHtml = `<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynamic Yield Template Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Trim', Arial, sans-serif;
            background-color: #f5f5f5;
            max-width: 1368px;
            margin: 0 auto;
        }
        
        /* Force font loading with test elements */
        .font-test {
            position: absolute;
            left: -9999px;
            top: -9999px;
            visibility: hidden;
        }
        .font-test-trim-light { font-family: 'Trim-Light', sans-serif; }
        .font-test-trim-medium { font-family: 'Trim-Medium', sans-serif; }
        .font-test-trim-bold { font-family: 'Trim-Bold', sans-serif; }
        .font-test-mikro-regular { font-family: 'Mikro-Regular', sans-serif; }
        .font-test-mikro-bold { font-family: 'Mikro-Bold', sans-serif; }
        .font-test-mikro-black { font-family: 'Mikro-Black', sans-serif; }
        .font-test-mulish-light { font-family: 'Mulish-Light', sans-serif; }
        .font-test-mulish-regular { font-family: 'Mulish-Regular', sans-serif; }
        .font-test-mulish-bold { font-family: 'Mulish-Bold', sans-serif; }
        .font-test-mulish-black { font-family: 'Mulish-Black', sans-serif; }
        .font-test-handwrite { font-family: 'ByggmaxHandwrite', sans-serif; }
        .font-test-icons { font-family: 'Byggmax-Icons', sans-serif; }
        
        /* Compiled CSS will be inserted here */
        ${compiledCss}
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Swiper/4.4.6/css/swiper.css">
</head>
<body>
    <!-- Hidden font test elements to force font loading -->
    <div class="font-test font-test-trim-light">Trim Light font test</div>
    <div class="font-test font-test-trim-medium">Trim Medium font test</div>
    <div class="font-test font-test-trim-bold">Trim Bold font test</div>
    <div class="font-test font-test-mikro-regular">Mikro Regular font test</div>
    <div class="font-test font-test-mikro-bold">Mikro Bold font test</div>
    <div class="font-test font-test-mikro-black">Mikro Black font test</div>
    <div class="font-test font-test-mulish-light">Mulish Light font test</div>
    <div class="font-test font-test-mulish-regular">Mulish Regular font test</div>
    <div class="font-test font-test-mulish-bold">Mulish Bold font test</div>
    <div class="font-test font-test-mulish-black">Mulish Black font test</div>
    <div class="font-test font-test-handwrite">ByggmaxHandwrite font test</div>
    <div class="font-test font-test-icons">Byggmax-Icons font test</div>
    
    ${compiledHtml}

    <script src="https://cdnjs.cloudflare.com/ajax/libs/Swiper/4.4.6/js/swiper.js"></script>
    <script>
        // Mock some global functions that the template expects
        window.dataLayer = window.dataLayer || [];
        window.DY = { API: function() { console.log('DY API call:', arguments); } };
        window.dispatchCartMessage = function(msg) { console.log('Cart message:', msg); };
        
        // Mock DYO.Q (Dynamic Yield's promise implementation)
        window.DYO = window.DYO || {};
        window.DYO.Q = window.DYO.Q || {};
        window.DYO.Q.Promise = function(executor) {
            return new Promise(executor);
        };
        
        ${compiledJs}
    </script>
</body>
</html>`;

      // Write compiled files
      fs.writeFileSync(path.join(this.outputDir, 'index.html'), fullHtml);
      fs.writeFileSync(path.join(this.outputDir, 'compiled.css'), compiledCss);
      fs.writeFileSync(path.join(this.outputDir, 'compiled.js'), compiledJs);
      fs.writeFileSync(path.join(this.outputDir, 'compiled-widget.html'), compiledHtml);

      console.log('✅ Templates compiled successfully!');
      console.log(`📁 Output directory: ${this.outputDir}`);
      console.log(`🌐 Preview: http://localhost:${this.port}`);
      
    } catch (error) {
      console.error('❌ Compilation error:', error);
    }
  }

  setupServer() {
    // Enable CORS for all routes
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Parse JSON bodies
    this.app.use(express.json());
    
    // Serve static files from dist directory
    this.app.use(express.static(this.outputDir));
    
    // Serve images from source directory
    this.app.use('/images', express.static(path.join(__dirname, 'images')));
    
    // Serve fonts from dist directory
    this.app.use('/fonts', express.static(this.fontsDir));
    
    // Serve the main page
    this.app.get('/', (req, res) => {
      const indexPath = path.join(this.outputDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.send(`
          <h1>Template Compiler</h1>
          <p>Templates are being compiled... Please wait and refresh.</p>
          <style>body { font-family: Arial, sans-serif; margin: 50px; }</style>
        `);
      }
    });

    // API endpoint to get compiled templates
    this.app.get('/api/templates', (req, res) => {
      try {
        const compiledWidget = fs.readFileSync(path.join(this.outputDir, 'compiled-widget.html'), 'utf8');
        const compiledCss = fs.readFileSync(path.join(this.outputDir, 'compiled.css'), 'utf8');
        const compiledJs = fs.readFileSync(path.join(this.outputDir, 'compiled.js'), 'utf8');
        
        res.json({
          html: compiledWidget,
          css: compiledCss,
          js: compiledJs,
          lastCompiled: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({ error: 'Templates not ready' });
      }
    });

    // Proxy endpoint for gallery updates (bypasses CORS)
    this.app.get('/catalog/ajax/getcustomstockpricelist', async (req, res) => {
      try {
        const productId = req.query.product_id;
        const isAjax = req.query.isAjax;
        
        // Mock response for testing - you can customize this
        const mockResponse = {
          medium: `https://via.placeholder.com/300x300/cccccc/666666?text=Product+${productId}`,
          errors: null
        };
        
        res.json(mockResponse);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Mock API endpoint for bmx_products/getProductDataByShop (matches template.js)
    this.app.post('/rest/V1/bmx_products/getProductDataByShop', async (req, res) => {
      try {
        const { shop, skus, customer_type, country } = req.body;
        
        console.log('API Request:', { shop, skus, customer_type, country });
        
        // Mock response data structure matching what template.js expects
        const mockResponse = skus.map((sku, index) => {
          // Hardcoded prices based on index for predictable testing
          const priceConfigs = [
            { basePrice: 899.00, hasDiscount: false, discountPercent: 0, stock: true, qty: 18 },     // Index 1: 899 -> 899
            { basePrice: 899.00, hasDiscount: false, discountPercent: 0, stock: true, qty: 18 },     // Index 1: 899 -> 899
            { basePrice: 2199.00, hasDiscount: true, discountPercent: 20, stock: true, qty: 12 },   // Index 2: 2199 -> 1759.20
            { basePrice: 799.00, hasDiscount: false, discountPercent: 0, stock: true, qty: 30 },     // Index 3: 799 -> 799
            { basePrice: 1799.00, hasDiscount: true, discountPercent: 25, stock: true, qty: 8 },     // Index 4: 1799 -> 1349.25
            { basePrice: 1599.00, hasDiscount: false, discountPercent: 0, stock: true, qty: 15 },   // Index 5: 1599 -> 1599
            { basePrice: 2499.00, hasDiscount: true, discountPercent: 30, stock: false, qty: 0 },   // Index 6: 2499 -> 1749.30 (out of stock)
            { basePrice: 699.00, hasDiscount: false, discountPercent: 0, stock: true, qty: 45 },     // Index 7: 699 -> 699
            { basePrice: 1899.00, hasDiscount: true, discountPercent: 10, stock: true, qty: 22 },   // Index 8: 1899 -> 1709.10
            { basePrice: 899.00, hasDiscount: false, discountPercent: 0, stock: true, qty: 18 },     // Index 1: 899 -> 899
            { basePrice: 2799.00, hasDiscount: true, discountPercent: 35, stock: true, qty: 5 },    // Index 10: 2799 -> 1819.35
            { basePrice: 999.00, hasDiscount: false, discountPercent: 0, stock: true, qty: 28 }      // Index 11: 999 -> 999
          ];
          
          const config = priceConfigs[index % priceConfigs.length];
          const finalPrice = config.hasDiscount ? config.basePrice * (1 - config.discountPercent / 100) : config.basePrice;
          
          return {
            sku: sku,
            final_price: parseFloat(finalPrice.toFixed(2)),
            regular_price: parseFloat(config.basePrice.toFixed(2)),
            discount_percentage: config.discountPercent,
            discount_end_date: config.hasDiscount ? '2024-12-31' : null,
            availability: {
              [sku]: config.stock
            },
            stock_qty: config.qty,
            customer_type: customer_type,
            shop: shop,
            country: country
          };
        });
        
        res.json(mockResponse);
        
      } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
          error: 'Internal server error',
          message: error.message 
        });
      }
    });


  }

  startServer() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Development server running at http://localhost:${this.port}`);
      console.log(`🌍 Current locale: ${this.locale}`);
      console.log(`📁 Using templates: template_${this.locale}.html/js`);
    });
  }

  watchFiles() {
    const watchPaths = [
      path.join(__dirname, 'template.html'),
      path.join(__dirname, 'template.css'), 
      path.join(__dirname, 'template.js'),
      path.join(__dirname, 'config.js'),
      path.join(__dirname, 'test.json')
    ];

    console.log('👀 Watching files for changes...');
    
    const watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules/,
      persistent: true
    });

    watcher.on('change', (filePath) => {
      console.log(`📝 File changed: ${path.basename(filePath)}`);
      
      // Run translator if template files change
      if (filePath.includes('template.html') || filePath.includes('template.js')) {
        this.runTranslator();
      }
      
      // Reload config and test data if they changed
      if (filePath.includes('config.js')) {
        delete require.cache[require.resolve('./config')];
        Object.assign(config, require('./config'));
        // Update locale after config reload
        this.locale = config.locale || 'sv';
      }
      
      if (filePath.includes('test.json')) {
        this.loadTestData();
      }
      
      this.compileAll();
    });

    watcher.on('error', error => console.error(`Watcher error: ${error}`));
  }

  async start() {
    console.log('🎯 Dynamic Yield Template Compiler');
    console.log('================================');
    
    // Run translator initially to ensure translated templates exist
    this.runTranslator();
    
    // Initial compilation
    await this.compileAll();
    
    // Start development server
    this.startServer();
    
    // Watch for file changes
    if (process.argv.includes('--watch') || process.argv.includes('-w')) {
      this.watchFiles();
    }
  }
}

// Start the compiler
const compiler = new TemplateCompiler();
compiler.start().catch(console.error);

module.exports = TemplateCompiler;
