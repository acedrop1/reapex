"use strict";
/**
 * Migration Script: Consolidate Storage Buckets
 *
 * Purpose: Move files from separate buckets into folder-based structure in 'documents' bucket
 *
 * Folder Structure:
 * documents/
 * ├── marketing/          # From marketing-files bucket
 * ├── forms/             # From brokerage_documents (already in documents)
 * ├── training/          # From training-resources bucket
 * ├── logos/             # From external-links bucket
 * └── {user-id}/         # User transaction documents (already in documents)
 *
 * IMPORTANT: Run this AFTER migration 089_consolidate_buckets_folder_based.sql
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv = __importStar(require("dotenv"));
var path = __importStar(require("path"));
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
/**
 * Copy files from source bucket to documents bucket with new folder prefix
 */
function migrateFiles(sourceBucket, targetFolder, stats) {
    return __awaiter(this, void 0, void 0, function () {
        var allFiles_2, listAllFiles_1, _i, allFiles_1, file, sourcePath, fileName, targetPath, _a, fileData, downloadError, uploadError, error_1, error_2;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("\n\uD83D\uDCC2 Migrating ".concat(sourceBucket, " \u2192 documents/").concat(targetFolder, "/"));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 10, , 11]);
                    allFiles_2 = [];
                    listAllFiles_1 = function () {
                        var args_1 = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args_1[_i] = arguments[_i];
                        }
                        return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (path) {
                            var _a, items, listError, _b, items_1, item, itemPath;
                            if (path === void 0) { path = ''; }
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, supabase.storage
                                            .from(sourceBucket)
                                            .list(path, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })];
                                    case 1:
                                        _a = _c.sent(), items = _a.data, listError = _a.error;
                                        if (listError) {
                                            console.error("\u274C Error listing files in ".concat(sourceBucket, "/").concat(path, ":"), listError);
                                            stats.errors.push("List error: ".concat(listError.message));
                                            return [2 /*return*/];
                                        }
                                        if (!items || items.length === 0) {
                                            return [2 /*return*/];
                                        }
                                        _b = 0, items_1 = items;
                                        _c.label = 2;
                                    case 2:
                                        if (!(_b < items_1.length)) return [3 /*break*/, 6];
                                        item = items_1[_b];
                                        itemPath = path ? "".concat(path, "/").concat(item.name) : item.name;
                                        if (!(item.id === null)) return [3 /*break*/, 4];
                                        // It's a folder, recurse into it
                                        return [4 /*yield*/, listAllFiles_1(itemPath)];
                                    case 3:
                                        // It's a folder, recurse into it
                                        _c.sent();
                                        return [3 /*break*/, 5];
                                    case 4:
                                        // It's a file, add to list
                                        allFiles_2.push(__assign(__assign({}, item), { fullPath: itemPath }));
                                        _c.label = 5;
                                    case 5:
                                        _b++;
                                        return [3 /*break*/, 2];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        });
                    };
                    return [4 /*yield*/, listAllFiles_1()];
                case 2:
                    _b.sent();
                    if (allFiles_2.length === 0) {
                        console.log("   \u2139\uFE0F  No files found in ".concat(sourceBucket));
                        return [2 /*return*/];
                    }
                    stats.totalFiles = allFiles_2.length;
                    console.log("   Found ".concat(allFiles_2.length, " files to migrate"));
                    _i = 0, allFiles_1 = allFiles_2;
                    _b.label = 3;
                case 3:
                    if (!(_i < allFiles_1.length)) return [3 /*break*/, 9];
                    file = allFiles_1[_i];
                    sourcePath = file.fullPath;
                    fileName = sourcePath.replace(/^(training|logos|marketing|forms)\//, '');
                    targetPath = "".concat(targetFolder, "/").concat(fileName);
                    console.log("   \uD83D\uDCC4 Processing: ".concat(sourcePath, " \u2192 ").concat(targetPath));
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 7, , 8]);
                    return [4 /*yield*/, supabase.storage
                            .from(sourceBucket)
                            .download(sourcePath)];
                case 5:
                    _a = _b.sent(), fileData = _a.data, downloadError = _a.error;
                    if (downloadError) {
                        console.error("   \u274C Failed to download ".concat(sourcePath, ":"), JSON.stringify(downloadError, null, 2));
                        stats.failed++;
                        stats.errors.push("Download ".concat(sourcePath, ": ").concat(downloadError.message || JSON.stringify(downloadError)));
                        return [3 /*break*/, 8];
                    }
                    return [4 /*yield*/, supabase.storage
                            .from('documents')
                            .upload(targetPath, fileData, {
                            cacheControl: '3600',
                            upsert: true, // Overwrite if exists
                        })];
                case 6:
                    uploadError = (_b.sent()).error;
                    if (uploadError) {
                        console.error("   \u274C Failed to upload ".concat(targetPath, ":"), JSON.stringify(uploadError, null, 2));
                        stats.failed++;
                        stats.errors.push("Upload ".concat(targetPath, ": ").concat(uploadError.message || JSON.stringify(uploadError)));
                        return [3 /*break*/, 8];
                    }
                    console.log("   \u2705 Copied: ".concat(sourcePath, " \u2192 ").concat(targetPath));
                    stats.copied++;
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    console.error("   \u274C Error processing ".concat(sourcePath, ":"), error_1);
                    stats.failed++;
                    stats.errors.push("Process ".concat(sourcePath, ": ").concat(error_1));
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 3];
                case 9: return [3 /*break*/, 11];
                case 10:
                    error_2 = _b.sent();
                    console.error("\u274C Migration failed for ".concat(sourceBucket, ":"), error_2);
                    stats.errors.push("Bucket migration error: ".concat(error_2));
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
/**
 * Update database references to point to new file paths
 */
function updateDatabaseReferences() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, brokerageDocs, brokerageError, _i, brokerageDocs_1, doc, newUrl, updateError, _b, trainingResources, trainingError, _c, trainingResources_1, resource, updates, updateError, _d, externalLinks, linksError, _e, externalLinks_1, link, newUrl, updateError;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log('\n📝 Updating database references...');
                    return [4 /*yield*/, supabase
                            .from('brokerage_documents')
                            .select('id, file_url')
                            .not('file_url', 'is', null)];
                case 1:
                    _a = _f.sent(), brokerageDocs = _a.data, brokerageError = _a.error;
                    if (!brokerageError) return [3 /*break*/, 2];
                    console.error('❌ Error fetching brokerage_documents:', brokerageError);
                    return [3 /*break*/, 6];
                case 2:
                    if (!(brokerageDocs && brokerageDocs.length > 0)) return [3 /*break*/, 6];
                    console.log("   Updating ".concat(brokerageDocs.length, " brokerage document references..."));
                    _i = 0, brokerageDocs_1 = brokerageDocs;
                    _f.label = 3;
                case 3:
                    if (!(_i < brokerageDocs_1.length)) return [3 /*break*/, 6];
                    doc = brokerageDocs_1[_i];
                    if (!(doc.file_url && !doc.file_url.startsWith('forms/'))) return [3 /*break*/, 5];
                    newUrl = "forms/".concat(doc.file_url);
                    return [4 /*yield*/, supabase
                            .from('brokerage_documents')
                            .update({ file_url: newUrl })
                            .eq('id', doc.id)];
                case 4:
                    updateError = (_f.sent()).error;
                    if (updateError) {
                        console.error("   \u274C Failed to update brokerage_documents ".concat(doc.id, ":"), updateError);
                    }
                    else {
                        console.log("   \u2705 Updated: ".concat(doc.file_url, " \u2192 ").concat(newUrl));
                    }
                    _f.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, supabase
                        .from('training_resources')
                        .select('id, video_url, document_url, thumbnail_url, preview_url')];
                case 7:
                    _b = _f.sent(), trainingResources = _b.data, trainingError = _b.error;
                    if (!trainingError) return [3 /*break*/, 8];
                    console.error('❌ Error fetching training_resources:', trainingError);
                    return [3 /*break*/, 12];
                case 8:
                    if (!(trainingResources && trainingResources.length > 0)) return [3 /*break*/, 12];
                    console.log("   Updating ".concat(trainingResources.length, " training resource references..."));
                    _c = 0, trainingResources_1 = trainingResources;
                    _f.label = 9;
                case 9:
                    if (!(_c < trainingResources_1.length)) return [3 /*break*/, 12];
                    resource = trainingResources_1[_c];
                    updates = {};
                    // Update video_url (only if it's a storage path, not HTTP URL)
                    if (resource.video_url && !resource.video_url.startsWith('training/') && !resource.video_url.startsWith('http')) {
                        updates.video_url = "training/".concat(resource.video_url);
                    }
                    // Update document_url (only if it's a storage path, not HTTP URL)
                    if (resource.document_url && !resource.document_url.startsWith('training/') && !resource.document_url.startsWith('http')) {
                        updates.document_url = "training/".concat(resource.document_url);
                    }
                    // Update thumbnail_url
                    if (resource.thumbnail_url && !resource.thumbnail_url.startsWith('training/') && !resource.thumbnail_url.startsWith('http')) {
                        updates.thumbnail_url = "training/".concat(resource.thumbnail_url);
                    }
                    // Update preview_url
                    if (resource.preview_url && !resource.preview_url.startsWith('training/') && !resource.preview_url.startsWith('http')) {
                        updates.preview_url = "training/".concat(resource.preview_url);
                    }
                    if (!(Object.keys(updates).length > 0)) return [3 /*break*/, 11];
                    return [4 /*yield*/, supabase
                            .from('training_resources')
                            .update(updates)
                            .eq('id', resource.id)];
                case 10:
                    updateError = (_f.sent()).error;
                    if (updateError) {
                        console.error("   \u274C Failed to update training_resources ".concat(resource.id, ":"), updateError);
                    }
                    else {
                        console.log("   \u2705 Updated training resource ".concat(resource.id));
                    }
                    _f.label = 11;
                case 11:
                    _c++;
                    return [3 /*break*/, 9];
                case 12: return [4 /*yield*/, supabase
                        .from('external_links')
                        .select('id, logo_url')
                        .not('logo_url', 'is', null)];
                case 13:
                    _d = _f.sent(), externalLinks = _d.data, linksError = _d.error;
                    if (!linksError) return [3 /*break*/, 14];
                    console.error('❌ Error fetching external_links:', linksError);
                    return [3 /*break*/, 18];
                case 14:
                    if (!(externalLinks && externalLinks.length > 0)) return [3 /*break*/, 18];
                    console.log("   Updating ".concat(externalLinks.length, " external link logo references..."));
                    _e = 0, externalLinks_1 = externalLinks;
                    _f.label = 15;
                case 15:
                    if (!(_e < externalLinks_1.length)) return [3 /*break*/, 18];
                    link = externalLinks_1[_e];
                    if (!(link.logo_url && !link.logo_url.startsWith('logos/') && !link.logo_url.startsWith('http'))) return [3 /*break*/, 17];
                    newUrl = "logos/".concat(link.logo_url);
                    return [4 /*yield*/, supabase
                            .from('external_links')
                            .update({ logo_url: newUrl })
                            .eq('id', link.id)];
                case 16:
                    updateError = (_f.sent()).error;
                    if (updateError) {
                        console.error("   \u274C Failed to update external_links ".concat(link.id, ":"), updateError);
                    }
                    else {
                        console.log("   \u2705 Updated: ".concat(link.logo_url, " \u2192 ").concat(newUrl));
                    }
                    _f.label = 17;
                case 17:
                    _e++;
                    return [3 /*break*/, 15];
                case 18:
                    // Note: canva_templates doesn't store file URLs, just external Canva links
                    console.log('   ℹ️  canva_templates uses external URLs, no migration needed');
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Main migration function
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var migrations, marketingStats, trainingStats, logosStats, totalFiles, totalCopied, totalFailed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting bucket consolidation migration\n');
                    console.log('Target bucket: documents');
                    console.log('Folder structure:');
                    console.log('  - marketing/  (from marketing-files)');
                    console.log('  - forms/      (brokerage documents)');
                    console.log('  - training/   (from training-resources)');
                    console.log('  - logos/      (from external-links)');
                    console.log('  - {user-id}/  (transaction documents - already correct)\n');
                    migrations = [];
                    marketingStats = {
                        bucket: 'marketing-files',
                        folder: 'marketing',
                        totalFiles: 0,
                        copied: 0,
                        failed: 0,
                        errors: [],
                    };
                    return [4 /*yield*/, migrateFiles('marketing-files', 'marketing', marketingStats)];
                case 1:
                    _a.sent();
                    migrations.push(marketingStats);
                    trainingStats = {
                        bucket: 'training-resources',
                        folder: 'training',
                        totalFiles: 0,
                        copied: 0,
                        failed: 0,
                        errors: [],
                    };
                    return [4 /*yield*/, migrateFiles('training-resources', 'training', trainingStats)];
                case 2:
                    _a.sent();
                    migrations.push(trainingStats);
                    logosStats = {
                        bucket: 'external-links',
                        folder: 'logos',
                        totalFiles: 0,
                        copied: 0,
                        failed: 0,
                        errors: [],
                    };
                    return [4 /*yield*/, migrateFiles('external-links', 'logos', logosStats)];
                case 3:
                    _a.sent();
                    migrations.push(logosStats);
                    // Update database references
                    return [4 /*yield*/, updateDatabaseReferences()];
                case 4:
                    // Update database references
                    _a.sent();
                    // Print summary
                    console.log('\n\n═══════════════════════════════════════');
                    console.log('📊 MIGRATION SUMMARY');
                    console.log('═══════════════════════════════════════\n');
                    totalFiles = 0;
                    totalCopied = 0;
                    totalFailed = 0;
                    migrations.forEach(function (stat) {
                        console.log("".concat(stat.bucket, " \u2192 documents/").concat(stat.folder, "/"));
                        console.log("  Total:  ".concat(stat.totalFiles));
                        console.log("  \u2705 Copied: ".concat(stat.copied));
                        console.log("  \u274C Failed: ".concat(stat.failed));
                        if (stat.errors.length > 0) {
                            console.log("  Errors:");
                            stat.errors.forEach(function (err) { return console.log("    - ".concat(err)); });
                        }
                        console.log('');
                        totalFiles += stat.totalFiles;
                        totalCopied += stat.copied;
                        totalFailed += stat.failed;
                    });
                    console.log('═══════════════════════════════════════');
                    console.log("TOTAL: ".concat(totalFiles, " files"));
                    console.log("\u2705 Successfully copied: ".concat(totalCopied));
                    console.log("\u274C Failed: ".concat(totalFailed));
                    console.log('═══════════════════════════════════════\n');
                    if (totalFailed === 0) {
                        console.log('✅ Migration completed successfully!');
                        console.log('\n📋 Next steps:');
                        console.log('1. Update code to use documents bucket with folder prefixes');
                        console.log('2. Test file uploads/downloads in each section');
                        console.log('3. Once verified, you can delete old buckets:');
                        console.log('   - marketing-files');
                        console.log('   - training-resources');
                        console.log('   - external-links (keep if still has files)');
                    }
                    else {
                        console.log('⚠️  Migration completed with errors. Review failed items above.');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Run migration
main()
    .then(function () { return process.exit(0); })
    .catch(function (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
