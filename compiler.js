const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const express = require('express');
const mustache = require('mustache');
const config = require('./config');

class TemplateCompiler {
  constructor() {
    this.app = express();
    this.port = 3000;
    this.outputDir = path.join(__dirname, 'dist');
    this.setupServer();
    this.loadTestData();
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
        subtitle: testData.feed.subtitle_2 || 'Premium kvalitet',
        price: (parseFloat(testData.feed.price_1) + (index * 100)).toFixed(2),
        sales_price: testData.feed.sales_price || null,
        dynamic_price: testData.feed.dynamic_price || '0',
        'Currency Symbol': 'kr',
        
        // USP elements
        usp_element: index === 0 ? 'New' : 
                    index === 1 ? 'Customer Favourite' :
                    index === 2 ? 'Better' :
                    index === 3 ? 'Best' :
                    index === 4 ? 'Greener Choice' : 'Good',
        usp_element_x_value: '',
        usp_element_y_value: '',
        usp_element_custom: '',
        
        // Parent product ID
        'parent-id': testData.feed.parent_sku || testData.feed.item_group_id
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
    
    // Convert product field variables to Mustache format
    const productFields = [
      'url', 'img_url', 'name', 'brand', 'subtitle', 'price', 'sales_price', 
      'dynamic_price', 'sku', 'parent-id', 'usp_element', 'usp_element_x_value', 
      'usp_element_y_value', 'usp_element_custom', 'Currency Symbol'
    ];
    
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

      // Read template files
      const htmlTemplate = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
      const cssTemplate = fs.readFileSync(path.join(__dirname, 'template.css'), 'utf8');
      const jsTemplate = fs.readFileSync(path.join(__dirname, 'template.js'), 'utf8');

      // Compile HTML with products
      console.log('Converting template syntax...');
      const compiledHtml = this.compileProductTemplate(htmlTemplate);
      
      // Compile CSS and JS (just variable replacement)
      const compiledCss = this.compileTemplate(cssTemplate);
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
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            max-width: 1368px;
            margin: 0 auto;
        }
        /* Compiled CSS will be inserted here */
        ${compiledCss}
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Swiper/4.4.6/css/swiper.css">
</head>
<body>
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
    // Serve static files from dist directory
    this.app.use(express.static(this.outputDir));
    
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
  }

  startServer() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Development server running at http://localhost:${this.port}`);
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
      
      // Reload config and test data if they changed
      if (filePath.includes('config.js')) {
        delete require.cache[require.resolve('./config')];
        Object.assign(config, require('./config'));
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
