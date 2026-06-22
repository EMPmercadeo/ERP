const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const htmlContent = fs.readFileSync('C:\\Users\\ermom\\Downloads\\ERP Panamá App.html', 'utf8');

// Use regex to extract manifest and template contents
const manifestMatch = htmlContent.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
const templateMatch = htmlContent.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
const extResourcesMatch = htmlContent.match(/<script type="__bundler\/ext_resources">([\s\S]*?)<\/script>/);

if (!manifestMatch || !templateMatch) {
  console.error("Could not find manifest or template script tags");
  process.exit(1);
}

const manifest = JSON.parse(manifestMatch[1].trim());
let template = JSON.parse(templateMatch[1].trim());
const extResources = extResourcesMatch ? JSON.parse(extResourcesMatch[1].trim()) : [];

console.log("Found manifest files:", Object.keys(manifest).length);

const outDir = path.join(__dirname, 'unpacked-app');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

const uuidToFilename = {};
for (const entry of extResources) {
  uuidToFilename[entry.uuid] = entry.id;
}

for (const [uuid, entry] of Object.entries(manifest)) {
  const buffer = Buffer.from(entry.data, 'base64');
  let decompressed = buffer;
  if (entry.compressed) {
    try {
      decompressed = zlib.gunzipSync(buffer);
    } catch (err) {
      console.warn(`Failed gzip decompression for ${uuid}, attempting zlib inflate...`);
      decompressed = zlib.inflateSync(buffer);
    }
  }
  const filename = uuidToFilename[uuid] || `${uuid}.txt`;
  const filePath = path.join(outDir, filename);
  
  const fileDir = path.dirname(filePath);
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, decompressed);
  console.log(`Unpacked ${filename} (${decompressed.length} bytes)`);
}

// Also save template
fs.writeFileSync(path.join(outDir, 'template.html'), template);
console.log("Saved template.html");
