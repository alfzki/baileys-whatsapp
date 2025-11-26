import { initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';
import { DatabaseService } from '@/services/database.js';
function serializeData(data) {
    try {
        return JSON.stringify(data, BufferJSON.replacer);
    }
    catch (error) {
        console.error('Error serializing data:', error);
        return '{}';
    }
}
function deserializeData(jsonString) {
    try {
        return JSON.parse(jsonString, BufferJSON.reviver);
    }
    catch (error) {
        console.error('Error deserializing data:', error);
        return {};
    }
}
export async function useDatabaseAuthState(sessionId) {
    let creds = initAuthCreds();
    const keys = {};
    const authDataList = await DatabaseService.getAuthData(sessionId);
    console.log(`[${sessionId}] Loading auth data from database, found ${authDataList.length} entries`);
    const credsData = authDataList.find(data => data.key === 'creds.json');
    if (credsData) {
        try {
            const parsedCreds = deserializeData(credsData.value);
            if (parsedCreds && typeof parsedCreds === 'object' && parsedCreds.noiseKey) {
                creds = parsedCreds;
                console.log(`[${sessionId}] Loaded valid credentials from database`);
            }
            else {
                console.log(`[${sessionId}] Invalid credentials structure, using defaults`);
                creds = initAuthCreds();
            }
        }
        catch (error) {
            console.error(`[${sessionId}] Error parsing credentials:`, error);
            creds = initAuthCreds();
        }
    }
    authDataList.forEach(data => {
        if (data.key !== 'creds.json') {
            try {
                const keyData = deserializeData(data.value);
                const keyType = getKeyTypeFromFileName(data.key);
                if (keyType && keyData && typeof keyData === 'object') {
                    keys[keyType] = keyData;
                    console.log(`[${sessionId}] Loaded key type: ${keyType}`);
                }
            }
            catch (error) {
                console.error(`[${sessionId}] Error parsing key data ${data.key}:`, error);
            }
        }
    });
    const state = {
        creds,
        keys: {
            get: (type, ids) => {
                const key = keys[type];
                if (!key)
                    return {};
                return ids.reduce((dict, id) => {
                    const value = key[id];
                    if (value) {
                        dict[id] = value;
                    }
                    return dict;
                }, {});
            },
            set: (data) => {
                for (const type in data) {
                    keys[type] = keys[type] || {};
                    Object.assign(keys[type], data[type]);
                }
            }
        }
    };
    const saveCreds = async () => {
        try {
            console.log(`[${sessionId}] Saving credentials to database`);
            await DatabaseService.saveAuthData(sessionId, 'creds.json', serializeData(creds));
            for (const keyType in keys) {
                const keyData = keys[keyType];
                if (keyData && typeof keyData === 'object' && Object.keys(keyData).length > 0) {
                    await DatabaseService.saveAuthData(sessionId, `${keyType}.json`, serializeData(keyData));
                    console.log(`[${sessionId}] Saved key type: ${keyType}`);
                }
            }
            console.log(`[${sessionId}] Credentials saved successfully`);
        }
        catch (error) {
            console.error(`[${sessionId}] Error saving credentials:`, error);
            throw error;
        }
    };
    const clearAuth = async () => {
        try {
            console.log(`[${sessionId}] Clearing auth data from database`);
            await DatabaseService.clearAuthData(sessionId);
        }
        catch (error) {
            console.error(`[${sessionId}] Error clearing auth data:`, error);
        }
    };
    const cleanup = () => {
        console.log(`[${sessionId}] Auth cleanup called`);
    };
    return { state, saveCreds, clearAuth, cleanup };
}
function getKeyTypeFromFileName(fileName) {
    const keyTypeMap = {
        'app-state-sync-key.json': 'app-state-sync-key',
        'app-state-sync-version.json': 'app-state-sync-version',
        'sender-key.json': 'sender-key',
        'sender-key-memory.json': 'sender-key-memory',
        'session.json': 'session',
        'pre-key.json': 'pre-key',
        'lid-mapping.json': 'lid-mapping',
        'device-list.json': 'device-list',
        'tctoken.json': 'tctoken'
    };
    return keyTypeMap[fileName] || null;
}
//# sourceMappingURL=databaseAuth.js.map