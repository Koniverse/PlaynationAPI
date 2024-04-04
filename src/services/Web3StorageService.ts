import {File, Web3Storage} from 'web3.storage';
import EnvVars from '@src/constants/EnvVars';
import {PutOptions} from 'web3.storage/src/lib/interface';

export class Web3StorageService {
  private client: Web3Storage;

  constructor() {
    this.client = new Web3Storage({token: EnvVars.WEB3STORAGE_TOKEN});
  }

  public generateJsonFiles(fileName: string, data: any): File {
    const blob = new Blob([JSON.stringify(data)], {type : 'application/json'});
    return new File([blob], `${fileName}.json`);
  }

  public async uploadFiles(files: File[], options?: PutOptions) {
    return await this.client.put(files, options);
  }

  public async uploadJson(data: any, name?: string) {
    const blob = new Blob([JSON.stringify(data)], {type : 'application/json'});
    const file = new File([blob], 'metadata.json', {type: 'application/json'});

    return await this.client.put([file], {wrapWithDirectory: false, name});
  }
}

const Web3StorageServiceImpl = new Web3StorageService();
export default Web3StorageServiceImpl;