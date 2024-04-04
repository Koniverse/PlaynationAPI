import fs from 'fs';
import Web3StorageServiceImpl from '@src/services/Web3StorageService';
import {File} from 'web3.storage';

describe('Web3StorageService', () => {
  it('should be able to upload folder', async () => {
    const files: File[] = [];
    
    // Fetch all files in folder data/simple-nfts to the file list
    const folder = 'src/data/dot-power-staker';
    const fileNames = fs.readdirSync(folder);
    for (const fileName of fileNames) {
      const xfile = fs.readFileSync(`${folder}/${fileName}`);
      files.push(new File([xfile], fileName));
    }
    
    const cid = await Web3StorageServiceImpl.uploadFiles(files, {
      name: 'DOT Power Staker',
    });
    console.log(cid);
  });
  it('should be able to upload files', async () => {
    const beginJson = {
      name: 'Polkadot Power Passport',
      description: 'Polkadot Power Passport is the first NFT by DOTinVietnam given to holders of more than sixty projects in the Polkadot ecosystem.',
      mediaUri: 'https://public-files.subwallet.app/dotinvietnam-psssport.gif',
      thumbnailUri: 'https://public-files.subwallet.app/dotinvietnam-psssport.gif',
      image: 'https://public-files.subwallet.app/dotinvietnam-psssport.gif',
    };
    const files: File[] = [];
    for (let i = 3; i < 15000; i++) {
      files.push(Web3StorageServiceImpl.generateJsonFiles(`nft-${i}`, {
        ...beginJson,
        name: `Passport #${i.toString()}`,
      }));
    }

    const cid = await Web3StorageServiceImpl.uploadFiles(files, {
      name: 'Dotinvietnam Passport Pool - 3-15',
    });
    console.log(cid);
  });
});