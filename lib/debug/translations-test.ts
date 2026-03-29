/**
 * Debug utility to test if translations are working correctly
 */

export async function debugTranslations() {
  console.log('%c=== TRANSLATION DEBUG ===', 'color: blue; font-weight: bold;')
  
  try {
    // Try loading both language files to ensure they exist
    const enMessages = (await import('../../messages/en.json')).default
    const trMessages = (await import('../../messages/tr.json')).default
    
    console.log('✓ English messages loaded:', Object.keys(enMessages).length, 'keys')
    console.log('  - dashboard keys:', Object.keys(enMessages.dashboard || {}).length)
    console.log('✓ Turkish messages loaded:', Object.keys(trMessages).length, 'keys')
    console.log('  - dashboard keys:', Object.keys(trMessages.dashboard || {}).length)
    
    // Compare keys to ensure all translations are present
    const enDashboardKeys = Object.keys(enMessages.dashboard || {})
    const trDashboardKeys = Object.keys(trMessages.dashboard || {})
    const missingInTr = enDashboardKeys.filter(key => !trDashboardKeys.includes(key))
    
    if (missingInTr.length > 0) {
      console.warn('⚠ Translation keys missing in Turkish:', missingInTr)
    } else {
      console.log('✓ All dashboard keys are translated')
    }
    
    console.log('%c=== END DEBUG ===', 'color: blue; font-weight: bold;')
  } catch (error) {
    console.error('✗ Error loading translation files:', error)
  }
}
