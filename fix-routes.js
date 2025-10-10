const fs = require('fs');
const path = require('path');

// Find all route.ts files recursively
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fix params in route handlers
function fixRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern 1: Fix function signature with params
  const pattern1 = /(\bexport\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE)\s*\([^)]*,\s*\{\s*params\s*\}:\s*\{\s*params:\s*)\{([^}]+)\}(\s*\})/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, '$1Promise<{$2}>$3');
    modified = true;
  }
  
  // Pattern 2: Fix requireAuth wrapper
  const pattern2 = /(\bexport\s+const\s+(?:GET|POST|PUT|PATCH|DELETE)\s*=\s*requireAuth\s*\(\s*async\s*\([^)]*,\s*[^,]+,\s*\{\s*params\s*\}:\s*\{\s*params:\s*)\{([^}]+)\}(\s*\})/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, '$1Promise<{$2}>$3');
    modified = true;
  }
  
  // Pattern 3: Fix params.id usage
  const pattern3 = /const\s+(\w+)\s*=\s*params\.id;/g;
  if (pattern3.test(content)) {
    content = content.replace(pattern3, 'const { id: $1 } = await params;');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const apiDir = path.join(__dirname, 'web', 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route files`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixRouteFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files`);