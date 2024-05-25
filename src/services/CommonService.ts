import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';


export class CommonService {

  public constructor() {  }

  async callActionChainService<T>(action: string, data: any){
    const  url = `${EnvVars.ChainService.Endpoint}/api/${action}`;
    const response = await fetch(
      url,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EnvVars.ChainService.Token}`,
        },
        method: 'POST',
        body: JSON.stringify(data),
        redirect: 'follow',
      });

    return (await response.json()) as T;
  }

  // Singleton
  private static _instance: CommonService;
  public static get instance(): CommonService {
    if (!this._instance) {
      this._instance = new CommonService();
    }
    return this._instance;
  }
}
