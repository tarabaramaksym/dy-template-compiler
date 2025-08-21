# Dynamic Yield Template Compiler

A Node.js development environment for compiling and testing Dynamic Yield content templates.

## Features

- ✅ Compiles `${}` template variables with actual values
- ✅ Processes Mustache templates for product loops
- ✅ Live file watching and auto-recompilation
- ✅ Development server with preview
- ✅ Uses test data from `test.json`
- ✅ Preserves original template structure

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server with file watching:
```bash
npm run dev
```

Or just compile once:
```bash
npm start
```

## Usage

1. **Preview**: Open http://localhost:3000 to see the compiled template
2. **Edit templates**: Modify `template.html`, `template.css`, or `template.js`
3. **Configure variables**: Edit `config.js` to change template variables
4. **Test data**: Modify `test.json` to change product data

The compiler will automatically recompile when any file changes.

## File Structure

```
dycontent/
├── template.html          # Original HTML template
├── template.css           # Original CSS template  
├── template.js            # Original JavaScript template
├── config.js              # Template configuration variables
├── test.json              # Test product data
├── compiler.js            # Main compiler script
├── package.json           # Node.js dependencies
└── dist/                  # Compiled output
    ├── index.html         # Full preview page
    ├── compiled.css       # Compiled CSS
    ├── compiled.js        # Compiled JavaScript
    └── compiled-widget.html # Compiled widget HTML
```

## API Endpoints

- `GET /` - Preview page
- `GET /api/templates` - JSON with compiled templates

## Configuration

Edit `config.js` to modify template variables:

```javascript
module.exports = {
  dyVariationId: 'test-123',
  Title: 'Rekommenderade produkter',
  'Large Screen': '4',
  // ... more variables
};
```

## How It Works

1. **Variable Replacement**: Replaces `${variable}` syntax with values from `config.js`
2. **Product Loop**: Uses Mustache to process `${#Recommendations}...${/Recommendations}` loops
3. **Test Data**: Creates multiple product variants from `test.json` for testing
4. **Live Preview**: Serves compiled templates on local development server

The compiler preserves the original template structure and only replaces variables and product loops as needed.