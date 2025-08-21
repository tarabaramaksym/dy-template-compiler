const fs = require('fs');
const path = require('path');

function readCsvToObject(csvPath) {
    try {
        const content = fs.readFileSync(csvPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        const translations = {};
        
        console.log(`📖 Reading CSV: ${path.basename(csvPath)}`);
        console.log(`  Raw content: "${content}"`);
        
        lines.forEach((line, index) => {
            const [original, translation] = line.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
            console.log(`  Line ${index + 1}: original="${original}" translation="${translation}"`);
            if (original && translation) {
                translations[original] = translation;
            }
        });
        
        console.log(`  Final translations object:`, translations);
        return translations;
    } catch (error) {
        console.error(`Error reading CSV file ${csvPath}:`, error.message);
        return {};
    }
}

function findTranslationFunctions(content) {
    const regex = /__\(([^)]+)\)/g;
    const matches = [];
    let match;
    
    console.log('🔍 Searching for __() patterns...');
    
    while ((match = regex.exec(content)) !== null) {
        const cleanText = match[1].trim().replace(/^['"`]|['"`]$/g, '');
        matches.push({
            fullMatch: match[0],
            text: cleanText,
            index: match.index
        });
        console.log(`  Found: "${match[0]}" -> text: "${cleanText}"`);
    }
    
    console.log(`Total matches found: ${matches.length}`);
    return matches;
}

function translateContent(content, translations, isHtml = false) {
    const matches = findTranslationFunctions(content);
    let result = content;
    
    console.log('🔄 Starting translation process...');
    console.log(`  Available translations:`, Object.keys(translations));
    console.log(`  File type: ${isHtml ? 'HTML' : 'JavaScript'}`);
    
    matches.reverse().forEach(match => {
        const translation = translations[match.text];
        console.log(`  Processing: "${match.text}" -> translation: "${translation}"`);
        
        if (translation) {
            const replacement = isHtml ? translation : `'${translation}'`;
            console.log(`    Replacing "${match.fullMatch}" with "${replacement}"`);
            result = result.slice(0, match.index) + replacement + result.slice(match.index + match.fullMatch.length);
        } else {
            console.log(`    ⚠ No translation found for "${match.text}"`);
        }
    });
    
    return result;
}

function processFile(filePath, translations, outputDir, languageCode) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const isHtml = filePath.endsWith('.html');
        const translatedContent = translateContent(content, translations, isHtml);
        
        const fileName = path.basename(filePath);
        const outputPath = path.join(outputDir, `${fileName.replace('.', `_${languageCode}.`)}`);
        
        fs.writeFileSync(outputPath, translatedContent, 'utf8');
        console.log(`✓ Created: ${outputPath}`);
        
        return true;
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    const i18nDir = path.join(__dirname, 'i18n');
    const outputDir = path.join(__dirname, 'translated_templates');
    const templateFiles = [
        path.join(__dirname, 'template.html'),
        path.join(__dirname, 'template.js')
    ];
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }
    
    const csvFiles = fs.readdirSync(i18nDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => path.join(i18nDir, file));
    
    if (csvFiles.length === 0) {
        console.log('No CSV files found in i18n directory');
        return;
    }
    
    console.log(`Found ${csvFiles.length} CSV file(s):`);
    csvFiles.forEach(file => console.log(`  - ${path.basename(file)}`));
    console.log('');
    
    csvFiles.forEach(csvPath => {
        const languageCode = path.basename(csvPath, '.csv');
        console.log(`Processing language: ${languageCode}`);
        
        const translations = readCsvToObject(csvPath);
        
        if (Object.keys(translations).length === 0) {
            console.log(`  ⚠ No translations found in ${path.basename(csvPath)}`);
            return;
        }
        
        console.log(`  Found ${Object.keys(translations).length} translations`);
        
        templateFiles.forEach(templatePath => {
            if (fs.existsSync(templatePath)) {
                processFile(templatePath, translations, outputDir, languageCode);
            } else {
                console.log(`  ⚠ Template file not found: ${path.basename(templatePath)}`);
            }
        });
        
        console.log('');
    });
    
    console.log('Translation process completed!');
}

if (require.main === module) {
    main();
}

module.exports = {
    readCsvToObject,
    findTranslationFunctions,
    translateContent,
    processFile
};
