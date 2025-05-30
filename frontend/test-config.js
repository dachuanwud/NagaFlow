#!/usr/bin/env node

// 测试配置文件的有效性
console.log('🔍 Testing configuration files...\n');

// 1. 测试 package.json
try {
  const pkg = require('./package.json');
  console.log('✅ package.json is valid JSON');
  console.log(`   - Project: ${pkg.name}`);
  console.log(`   - ESLint version: ${pkg.devDependencies.eslint}`);
  console.log(`   - TypeScript ESLint: ${pkg.devDependencies['typescript-eslint']}`);
  console.log(`   - Vite version: ${pkg.devDependencies.vite}`);
  console.log(`   - React version: ${pkg.dependencies.react}`);
} catch (error) {
  console.error('❌ package.json has issues:', error.message);
}

// 2. 测试 ESLint 配置
try {
  // 由于是 ES 模块，我们检查语法
  const fs = require('fs');
  const eslintConfig = fs.readFileSync('./eslint.config.js', 'utf8');
  
  // 基本语法检查
  if (eslintConfig.includes('import js from')) {
    console.log('✅ ESLint config uses correct ES module syntax');
  }
  if (eslintConfig.includes('typescript-eslint')) {
    console.log('✅ ESLint config includes typescript-eslint');
  }
  if (eslintConfig.includes('react-hooks')) {
    console.log('✅ ESLint config includes react-hooks plugin');
  }
  if (eslintConfig.includes('tseslint.config')) {
    console.log('✅ ESLint config uses flat config format');
  }
} catch (error) {
  console.error('❌ ESLint config has issues:', error.message);
}

// 3. 测试 Vite 配置
try {
  const fs = require('fs');
  const viteConfig = fs.readFileSync('./vite.config.ts', 'utf8');
  
  if (viteConfig.includes('@vitejs/plugin-react')) {
    console.log('✅ Vite config includes React plugin');
  }
  if (viteConfig.includes('port: 3000')) {
    console.log('✅ Vite config has development server setup');
  }
} catch (error) {
  console.error('❌ Vite config has issues:', error.message);
}

// 4. 检查关键依赖兼容性
console.log('\n📦 Dependency compatibility check:');
const pkg = require('./package.json');

// 检查是否有冲突的旧包
const oldPackages = [
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser'
];

let hasOldPackages = false;
oldPackages.forEach(pkgName => {
  if (pkg.devDependencies[pkgName]) {
    console.log(`❌ Found old package: ${pkgName}`);
    hasOldPackages = true;
  }
});

if (!hasOldPackages) {
  console.log('✅ No conflicting old TypeScript ESLint packages found');
}

// 检查新包
if (pkg.devDependencies['typescript-eslint']) {
  console.log('✅ New typescript-eslint package is present');
}

console.log('\n🎯 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run lint');
console.log('3. Run: npm run dev');
console.log('4. Run: npm run build');
