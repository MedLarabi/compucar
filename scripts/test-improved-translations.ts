#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

async function testImprovedTranslations() {
  try {
    console.log('🧪 Testing improved translations for inProgressDescriptionWithTime...');

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
          
          // Check for redundancy
          const timeCount = (current.match(/time/gi) || []).length;
          if (timeCount > 1) {
            console.log(`   ⚠️  Still has ${timeCount} instances of 'time'`);
          } else {
            console.log(`   ✅ No redundant 'time' words`);
          }
        } else {
          console.log(`   ⚠️  Missing {time} placeholder`);
        }
      } else {
        console.log(`❌ ${locale.toUpperCase()}: Translation not found`);
        console.log(`   Key: ${translationKey}`);
      }
      
      console.log('');
    }

    console.log('🎉 Improved translation test completed!');

  } catch (error) {
    console.error('❌ Error testing improved translations:', error);
  }
}

testImprovedTranslations();
