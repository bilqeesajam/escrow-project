#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚨 TEMPLATE FILE VALIDATION - GITHUB ACTIONS');
console.log('=============================================\n');

// All files from the original template must exists
const ALL_REQUIRED_FILES = [
  // Public assets
  'public/favicon.ico',
  'public/placeholder.svg',
  'public/robots.txt',
  
  // UI components (ALL shadcn files)
  'src/components/ui/accordion.tsx',
  'src/components/ui/alert-dialog.tsx',
  'src/components/ui/alert.tsx',
  'src/components/ui/aspect-ratio.tsx',
  'src/components/ui/avatar.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/breadcrumb.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/calendar.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/carousel.tsx',
  'src/components/ui/chart.tsx',
  'src/components/ui/checkbox.tsx',
  'src/components/ui/collapsible.tsx',
  'src/components/ui/command.tsx',
  'src/components/ui/context-menu.tsx',
  'src/components/ui/dialog.tsx',
  'src/components/ui/drawer.tsx',
  'src/components/ui/dropdown-menu.tsx',
  'src/components/ui/form.tsx',
  'src/components/ui/hover-card.tsx',
  'src/components/ui/input-otp.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/label.tsx',
  'src/components/ui/menubar.tsx',
  'src/components/ui/navigation-menu.tsx',
  'src/components/ui/pagination.tsx',
  'src/components/ui/popover.tsx',
  'src/components/ui/progress.tsx',
  'src/components/ui/radio-group.tsx',
  'src/components/ui/resizable.tsx',
  'src/components/ui/scroll-area.tsx',
  'src/components/ui/select.tsx',
  'src/components/ui/separator.tsx',
  'src/components/ui/sheet.tsx',
  'src/components/ui/sidebar.tsx',
  'src/components/ui/skeleton.tsx',
  'src/components/ui/slider.tsx',
  'src/components/ui/sonner.tsx',
  'src/components/ui/switch.tsx',
  'src/components/ui/table.tsx',
  'src/components/ui/tabs.tsx',
  'src/components/ui/textarea.tsx',
  'src/components/ui/toast.tsx',
  'src/components/ui/toaster.tsx',
  'src/components/ui/toggle-group.tsx',
  'src/components/ui/toggle.tsx',
  'src/components/ui/tooltip.tsx',
  'src/components/ui/use-toast.ts',
  
  // Core components
  'src/components/AppLayout.tsx',
  'src/components/AppSidebar.tsx',
  'src/components/ConfirmModal.tsx',
  'src/components/EmptyState.tsx',
  'src/components/GigCard.tsx',
  'src/components/NavLink.tsx',
  'src/components/NotificationBell.tsx',
  'src/components/PINInput.tsx',
  'src/components/ProtectedRoute.tsx',
  'src/components/StatusBadge.tsx',
  'src/components/ThemeToggle.tsx',
  'src/App.css',
  'src/App.tsx',
  'src/index.css',
  'src/main.tsx',
  'src/vite-env.d.ts',

  //supabase integrations
  'src/integrations/supabase/client.ts',
  'src/integrations/supabase/types.ts',

  // Hooks
  'src/hooks/use-mobile.tsx',
  'src/hooks/use-toast.ts',
  
  // Lib
  'src/lib/auth-context.tsx',
  'src/lib/theme-context.tsx',
  'src/lib/utils.ts',
  
  // Pages
  'src/pages/admin/AdminDashboardPage.tsx',
  'src/pages/admin/AdminDisputesPage.tsx',
  'src/pages/admin/AdminGigsPage.tsx',
  'src/pages/admin/AdminKYCPage.tsx',
  'src/pages/admin/AdminUsersPage.tsx',
  'src/pages/hustlers/EarningsPage.tsx',
  'src/pages/hustlers/MarketplacePage.tsx',
  'src/pages/hustlers/MyJobsPage.tsx',
  'src/pages/users/MyGigsPage.tsx',
  'src/pages/users/PostGigPage.tsx',
  'src/pages/users/WalletPage.tsx',
  'src/pages/ChooseRolePage.tsx',
  'src/pages/DashboardRedirect.tsx',
  'src/pages/GigDetailPage.tsx',
  'src/pages/Index.tsx',
  'src/pages/KYCPage.tsx',
  'src/pages/KYCPendingPage.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/NotFound.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/SignupPage.tsx',
  
  // Test files
  'src/test/example.test.ts',
  'src/test/setup.ts',
  
  // App files
  'src/App.css',
  'src/App.tsx',
  'src/index.css',
  'src/main.tsx',
  'src/vite-env.d.ts',

  // Supabase files
  'supabase/migrations/20260309173246_a5aa4d4f-7f7e-4661-9339-123824fb405c.sql',
  'supabase/migrations/20260309173255_cc41ee1f-c658-4956-8fa1-d97f1f38a7cf.sql',
  'supabase/config.toml',

  // env
  '.env',
  
  // Git
  '.gitignore',
  
  // Package management
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  'package.json',
  
  // Config files
  'components.json',
  'eslint.config.js',
  'index.html',
  'postcss.config.js',
  'README.md',
  'tailwind.config.ts',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'vitest.config.ts',
  'playwright-fixture.ts',
  'playwright.config.ts'
];

console.log(`🔍 Checking ${ALL_REQUIRED_FILES.length} template files...\n`);

// Check every file exists
let missingFiles = [];
let existingFiles = 0;

ALL_REQUIRED_FILES.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  if (fs.existsSync(fullPath)) {
    existingFiles++;
    // Only show first few for brevity
    if (existingFiles <= 5) {
      console.log(`✅ ${file}`);
    }
  } else {
    missingFiles.push(file);
    // Show all missing files
    console.log(`❌ ${file} - MISSING!`);
  }
});

// Show summary
if (existingFiles > 5) {
  console.log(`✅ ... and ${existingFiles - 5} more files exist`);
}

console.log(`\n📊 SUMMARY:`);
console.log(`   Total files to check: ${ALL_REQUIRED_FILES.length}`);
console.log(`   Files found: ${existingFiles}`);
console.log(`   Files missing: ${missingFiles.length}`);

// Fail github actions if files are missing
if (missingFiles.length > 0) {
  console.log('\n❌❌❌ VALIDATION FAILED!');
  console.log(`🚨 ${missingFiles.length} template files are missing!`);
  console.log('\n📁 Missing files by category:');
  
  // Group missing files by category
  const categories = {
    'Public Assets': missingFiles.filter(f => f.includes('public/')),
    'UI Components': missingFiles.filter(f => f.includes('components/ui/')),
    'Core Components': missingFiles.filter(f => f.includes('components/') && !f.includes('ui/')),
    'Hooks': missingFiles.filter(f => f.includes('hooks/')),
    'Lib': missingFiles.filter(f => f.includes('lib/')),
    'Pages': missingFiles.filter(f => f.includes('pages/')),
    'Test Files': missingFiles.filter(f => f.includes('test/')),
    'App Files': missingFiles.filter(f => f.startsWith('src/') && 
      !f.includes('components/') && 
      !f.includes('hooks/') && 
      !f.includes('lib/') && 
      !f.includes('pages/') && 
      !f.includes('test/')),
    'Config Files': missingFiles.filter(f => !f.includes('src/') && !f.includes('public/'))
  };
  
  // Show missing files by category
  Object.entries(categories).forEach(([category, files]) => {
    if (files.length > 0) {
      console.log(`\n📁 ${category} (${files.length}):`);
      files.forEach(file => {
        const cleanName = file.replace(/^.*[\\\/]/, '');
        console.log(`   • ${cleanName}`);
      });
    }
  });
  
  console.log('\n All files from the original template must exist!');
  
  // Force exit with error code 1; fail github actions
  console.log('\n Exiting with error code 1...');
  process.exit(1);
}

// All files exist
console.log('\n VALIDATION PASSED!');
console.log(' All template files are present!');

// Quick verification
console.log('\n🔧 Verifying package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  console.log('Key dependencies found:');
  ['react', 'typescript', 'vite', 'tailwindcss'].forEach(dep => {
    console.log(`   ${deps[dep] ? '✅' : '⚠️ '} ${dep}`);
  });
} catch (error) {
  console.log('Could not analyze package.json');
}

// Exit with success code 0
process.exit(0);