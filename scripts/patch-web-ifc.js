import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, '../node_modules/web-ifc/web-ifc-api.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  const oldCode1 = `StreamMeshes(modelID, expressIDs, meshCallback, applyLinearScalingFactor = true) {
    this.wasmModule.StreamMeshes(modelID, expressIDs, meshCallback, applyLinearScalingFactor);
  }`;

  const patchCode1 = `StreamMeshes(modelID, expressIDs, meshCallback, applyLinearScalingFactor = true) {
    try {
      this.wasmModule.StreamMeshes(modelID, expressIDs, meshCallback);
    } catch (err) {
      if (err && err.message && err.message.includes("expected 4")) {
        this.wasmModule.StreamMeshes(modelID, expressIDs, meshCallback, applyLinearScalingFactor);
      } else {
        throw err;
      }
    }
  }`;

  const oldCode2 = `StreamAllMeshes(modelID, meshCallback, applyLinearScalingFactor = true) {
    this.wasmModule.StreamAllMeshes(modelID, meshCallback, applyLinearScalingFactor);
  }`;

  const patchCode2 = `StreamAllMeshes(modelID, meshCallback, applyLinearScalingFactor = true) {
    try {
      this.wasmModule.StreamAllMeshes(modelID, meshCallback);
    } catch (err) {
      if (err && err.message && err.message.includes("expected 3")) {
        this.wasmModule.StreamAllMeshes(modelID, meshCallback, applyLinearScalingFactor);
      } else {
        throw err;
      }
    }
  }`;

  let modified = false;
  if (content.includes(oldCode1)) {
    content = content.replace(oldCode1, patchCode1);
    modified = true;
  }
  if (content.includes(oldCode2)) {
    content = content.replace(oldCode2, patchCode2);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-web-ifc] Successfully applied StreamMeshes argument compatibility patch.');
  }
}
