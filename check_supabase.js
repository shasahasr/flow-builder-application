// Simple script to check Supabase configuration and data
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read environment variables from .env file
function loadEnv () {
  try {
    const envPath = path.resolve(__dirname, '.env')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}

    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        envVars[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
      }
    })

    return envVars
  } catch (err) {
    console.error('Error reading .env file:', err.message)
    return {}
  }
}

// Main function
async function main () {
  console.log('Checking Supabase Configuration')
  console.log('==============================')

  // Load environment variables
  const env = loadEnv()
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY

  // Check if Supabase is configured
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file')
    console.log(
      'Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set in your .env file'
    )
    return
  } else {
    console.log('✅ Supabase credentials found in .env file')
    console.log(`URL: ${supabaseUrl.substring(0, 20)}...`)
    console.log(
      `Key: ${supabaseKey.substring(0, 5)}...${supabaseKey.substring(
        supabaseKey.length - 4
      )}`
    )
  }

  // Check for package.json and node_modules
  console.log('\nChecking for @supabase/supabase-js package...')

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const hasSupabase =
      packageJson.dependencies &&
      packageJson.dependencies['@supabase/supabase-js']

    if (hasSupabase) {
      console.log(
        `✅ @supabase/supabase-js found in package.json (version ${packageJson.dependencies['@supabase/supabase-js']})`
      )
    } else {
      console.error(
        '❌ @supabase/supabase-js not found in package.json dependencies'
      )
      console.log('Run: npm install @supabase/supabase-js')
      return
    }
  } catch (err) {
    console.error('❌ Error reading package.json:', err.message)
    return
  }

  // Check for SQL file
  console.log('\nChecking for SQL setup file...')
  if (fs.existsSync('supabase/workflows.sql')) {
    console.log('✅ Found supabase/workflows.sql file')

    // Show content of the SQL file
    console.log('\nSQL file contains:')
    const sqlContent = fs.readFileSync('supabase/workflows.sql', 'utf8')
    const hasRLS = sqlContent.includes('ROW LEVEL SECURITY')
    const hasUserIsolation = sqlContent.includes('user_id = auth.uid()')

    console.log(
      `- Contains Row Level Security setup: ${hasRLS ? '✅ Yes' : '❌ No'}`
    )
    console.log(
      `- Contains user isolation policy: ${
        hasUserIsolation ? '✅ Yes' : '❌ No'
      }`
    )

    if (hasUserIsolation) {
      console.log(
        '\n⚠️ The SQL file uses auth.uid() for user isolation, which may not work with Clerk authentication.'
      )
      console.log('Consider updating to the policy in workflows_updated.sql')
    }
  } else {
    console.error('❌ SQL setup file not found at supabase/workflows.sql')
    console.log(
      'Make sure you have created the SQL file to set up the workflows table and RLS policies'
    )
  }

  console.log('\nTroubleshooting Instructions:')
  console.log('1. Make sure your Supabase project is created and running')
  console.log('2. Apply the SQL script to create the workflows table')
  console.log(
    '3. Update the RLS policy using the scripts/update_rls_policy.sh script'
  )
  console.log('4. Run npm install to ensure all packages are installed')
  console.log('5. Restart your application')

  console.log('\nTo see the Yes/No Condition node:')
  console.log('1. Make sure YesNoConditionNode.tsx is properly implemented')
  console.log("2. Check that it's registered in src/nodes/index.ts")
  console.log(
    "3. Verify that it's properly handled in the workflow execution logic in WorkflowContext.tsx"
  )
}

main().catch(err => {
  console.error('Unexpected error:', err)
})
