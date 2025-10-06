#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

async function testTranslations() {
  try {
    console.log('🧪 Testing translation files for inProgressDescriptionWithTime...');

    const locales = ['en', 'fr', 'ar'];
    const translationKey = 'fileDetail.status.inProgressDescriptionWithTime';

    for (const locale of locales) {
      const filePath = path.join(__dirname, '..', 'locales', locale, 'common.json');
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Translation file not found: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const translations = JSON.parse(content);

      // Navigate to the nested key
      const keys = translationKey.split('.');
      let current = translations;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          current = null;
          break;
        }
      }

      if (current && typeof current === 'string') {
        console.log(`✅ ${locale.toUpperCase()}: Found translation`);
        console.log(`   Key: ${translationKey}`);
        console.log(`   Value: "${current}"`);
        
        // Check if it contains the {time} placeholder
        if (current.includes('{time}')) {
          console.log(`   ✅ Contains {time} placeholder`);
          
          // Test with a sample time
          const testTime = 15;
          const testTranslation = current.replace('{time}', testTime.toString());
          console.log(`   📝 Sample with time=${testTime}: "${testTranslation}"`);
        } else {
          console.log(`   ⚠️  Missing {time} placeholder`);
        }
      } else {
        console.log(`❌ ${locale.toUpperCase()}: Translation not found`);
        console.log(`   Key: ${translationKey}`);
      }
      
      console.log('');
    }

    // Test the actual usage in the code
    console.log('🔍 Testing code usage...');
    const codePath = path.join(__dirname, '..', 'src', 'app', 'files', '[id]', 'page.tsx');
    
    if (fs.existsSync(codePath)) {
      const codeContent = fs.readFileSync(codePath, 'utf-8');
      
      if (codeContent.includes('inProgressDescriptionWithTime')) {
        console.log('✅ Code contains the translation key');
        
        if (codeContent.includes('{ time: file.estimatedProcessingTime }')) {
          console.log('✅ Code properly passes time parameter');
        } else {
          console.log('❌ Code missing time parameter');
        }
      } else {
        console.log('❌ Code does not contain the translation key');
      }
    } else {
      console.log('❌ Code file not found');
    }

    console.log('\n🎉 Translation test completed!');

  } catch (error) {
    console.error('❌ Error testing translations:', error);
  }
}

testTranslations();
