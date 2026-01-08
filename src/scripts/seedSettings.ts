import { supabase } from '../lib/supabase'

export async function seedSettings() {
  try {
    // Insert default settings
    const { error } = await supabase
      .from('settings')
      .upsert([
        { key: 'show_results_immediately', value: true }
      ])

    if (error) {
      console.error('Error seeding settings:', error)
      return false
    }

    console.log('Settings seeded successfully')
    return true
  } catch (error) {
    console.error('Error seeding settings:', error)
    return false
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSettings()
}