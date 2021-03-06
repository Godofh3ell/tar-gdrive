import constants = require('../.constants');
import driveAuth = require('./drive-auth');
import { google } from 'googleapis';

export async function getGDindexLink(fileId: string, isUrl?: boolean) {
    if (isUrl) {
        let url = fileId.match(/[-\w]{25,}/);
        fileId = Array.isArray(url) && url.length > 0 ? url[0] : ''
    }
    return new Promise(async (resolve, reject) => {
        if (fileId) {
            driveAuth.call((authErr, auth) => {
                if (authErr) {
                    reject(authErr);
                }
                const drive = google.drive({ version: 'v3', auth });

                drive.files.get({ fileId: fileId, fields: 'id, name, parents, mimeType', supportsAllDrives: true },
                    async (err: Error, res: any) => {
                        if (err) {
                            reject(err.message);
                        } else {
                            if (res.data) {
                                let url = constants.INDEX_DOMAIN + encodeURIComponent(await getFilePathDrive(res.data.parents, drive) + res.data.name);
                                if (res.data.mimeType === 'application/vnd.google-apps.folder') {
                                    url += '/'
                                }
                                resolve(isUrl ? { url: url, name: res.data.name } : url);
                            } else {
                                reject('🔥 error: %o : File not found');
                            }
                        }
                    });
            });
        } else {
            reject('🔥 error: %o : File id not found');
        }
    });
}

async function getFilePathDrive(parents: any, drive: any) {
    let parent = parents;
    let tree = [];
    let path: string = '';
    if (parent) {
        do {
            const f = await drive.files.get({ fileId: parent[0], fields: 'id, name, parents', supportsAllDrives: true });
            parent = f.data.parents;
            if (!parent) break;
            tree.push({ 'id': parent[0], 'name': f.data.name })
        } while (true);
    }
    tree.reverse();
    for (const folder of tree) {
        if (folder.name !== 'Stuffs' && folder.name !== 'AnotherGdriveBot') {
            path += folder.name + '/';
        }
    }
    return path;
}
