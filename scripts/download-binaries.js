const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const binariesDir = path.join(__dirname, '..', 'bin');

// Create binaries directory if it doesn't exist
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

// FFmpeg/ffprobe binary configurations for different platforms
const platforms = {
  'win32-x64': {
    ffmpeg: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      archiveType: 'zip',
      path: 'ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe',
      out: 'ffmpeg.exe'
    },
    ffprobe: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      archiveType: 'zip',
      path: 'ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe',
      out: 'ffprobe.exe'
    }
  },
  'mac-x64': {
    ffmpeg: {
      url: 'https://evermeet.cx/ffmpeg/getrelease/zip',
      archiveType: 'zip',
      path: 'ffmpeg',
      out: 'ffmpeg'
    },
    ffprobe: {
      url: 'https://evermeet.cx/ffmpeg/ffprobe-7.1.1.zip',
      archiveType: 'zip',
      path: 'ffprobe',
      out: 'ffprobe'
    }
  },
  'mac-arm64': {
    ffmpeg: {
      url: 'https://evermeet.cx/ffmpeg/getrelease/zip',
      archiveType: 'zip',
      path: 'ffmpeg',
      out: 'ffmpeg'
    },
    ffprobe: {
      url: 'https://evermeet.cx/ffmpeg/ffprobe-7.1.1.zip',
      archiveType: 'zip',
      path: 'ffprobe',
      out: 'ffprobe'
    }
  },
  'linux-x64': {
    ffmpeg: {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
      archiveType: 'tar.xz',
      path: 'ffmpeg-*/ffmpeg',
      out: 'ffmpeg'
    },
    ffprobe: {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
      archiveType: 'tar.xz',
      path: 'ffmpeg-*/ffprobe',
      out: 'ffprobe'
    }
  }
};

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => fs.rmSync(path.join(dir, f), { force: true }));
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from: ${url}`);
    
    const download = (downloadUrl, originalUrl) => {
      const file = fs.createWriteStream(destination);
      
      https.get(downloadUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          let newUrl = response.headers.location;
          if (!/^https?:\/\//i.test(newUrl)) {
            // Relative redirect, resolve against original
            const { URL } = require('url');
            const base = new URL(downloadUrl, originalUrl || url);
            newUrl = new URL(newUrl, base).toString();
          }
          console.log(`Redirecting to: ${newUrl}`);
          download(newUrl, downloadUrl);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize) {
            const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
            process.stdout.write(`\rDownloading... ${progress}%`);
          }
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          process.stdout.write('\n');
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destination, () => {}); // Delete the file async
        reject(err);
      });
    };
    
    download(url);
  });
}

function extractBinary(archivePath, platform, config, platformDir) {
  try {
    if (config.archiveType === 'zip') {
      // Use -o to always overwrite
      execSync(`unzip -o -j "${archivePath}" "${config.path}" -d "${platformDir}"`);
    } else if (config.archiveType === 'tar.xz') {
      execSync(`tar -xf "${archivePath}" --strip-components=1 -C "${platformDir}" "${config.path}"`);
    }
    // Rename to standard output name if needed
    const extracted = path.join(platformDir, path.basename(config.path));
    const target = path.join(platformDir, config.out);
    if (extracted !== target && fs.existsSync(extracted)) {
      fs.renameSync(extracted, target);
    }
    // Make binaries executable (for non-Windows platforms)
    if (!config.out.endsWith('.exe')) {
      fs.chmodSync(target, 0o755);
    }
    console.log(`✅ Extracted ${config.out} for ${platform}`);
  } catch (error) {
    console.error(`❌ Failed to extract ${config.out} for ${platform}:`, error.message);
  }
}

function checkBinariesExist(platform, binConfigs) {
  const platformDir = path.join(binariesDir, platform);
  if (!fs.existsSync(platformDir)) {
    return false;
  }
  
  for (const [bin, config] of Object.entries(binConfigs)) {
    const binaryPath = path.join(platformDir, config.out);
    if (!fs.existsSync(binaryPath)) {
      return false;
    }
  }
  return true;
}

async function downloadBinaries() {
  console.log('🚀 Checking FFmpeg and FFprobe binaries for all platforms...\n');
  
  let allBinariesExist = true;
  
  for (const [platform, binConfigs] of Object.entries(platforms)) {
    console.log(`\n📦 Checking ${platform}...`);
    if (checkBinariesExist(platform, binConfigs)) {
      console.log(`✅ Binaries already exist for ${platform}, skipping...`);
    } else {
      console.log(`📥 Downloading binaries for ${platform}...`);
      allBinariesExist = false;
      const platformDir = path.join(binariesDir, platform);
      cleanDir(platformDir);
      for (const [bin, config] of Object.entries(binConfigs)) {
        const archivePath = path.join(binariesDir, `${platform}-${bin}.${config.archiveType}`);
        try {
          await downloadFile(config.url, archivePath);
          extractBinary(archivePath, platform, config, platformDir);
          fs.unlinkSync(archivePath);
        } catch (error) {
          console.error(`❌ Failed to process ${bin} for ${platform}:`, error.message);
        }
      }
    }
  }
  
  if (allBinariesExist) {
    console.log('\n🎉 All binaries already exist! No download needed.');
  } else {
    console.log('\n🎉 Binary download completed!');
  }
  
  console.log('\n📁 Binaries are now available in the "bin" directory:');
  for (const platform of Object.keys(platforms)) {
    const platformDir = path.join(binariesDir, platform);
    if (fs.existsSync(platformDir)) {
      const files = fs.readdirSync(platformDir);
      console.log(`  ${platform}: ${files.join(', ')}`);
    }
  }
}

// Run the download
downloadBinaries().catch(console.error); 