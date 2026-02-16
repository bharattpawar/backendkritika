import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
const IGNORED_FILES = ['.DS_Store', 'package-lock.json', 'yarn.lock'];
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php', '.html', '.css', '.json', '.md'];

export const extractZip = async (zipPath, extractPath) => {
  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);
    return extractPath;
  } catch (error) {
    throw new Error(`ZIP extraction failed: ${error.message}`);
  }
};

export const getAllFiles = (dirPath, fileList = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (CODE_EXTENSIONS.includes(ext) && !IGNORED_FILES.includes(file)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
};

export const readFileContent = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error.message);
    return '';
  }
};

export const cleanupDirectory = (dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Cleanup failed for ${dirPath}:`, error.message);
  }
};
