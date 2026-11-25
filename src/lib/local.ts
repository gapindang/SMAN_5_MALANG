import {resolve} from 'node:path';
import {createLocalStore} from './local-store.mjs';
export const localMode=()=>import.meta.env.DEV&&!process.env.BLOB_READ_WRITE_TOKEN;
export const local=createLocalStore(resolve(process.cwd(),'.data'));
