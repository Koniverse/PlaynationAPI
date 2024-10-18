export interface CMSSyncPayload {
  action: string,
  model: string,
  uid: string,
  entry: any
}

export class CMSSyncService {
  async sync(model: string, action: string, data: CMSSyncPayload) {
    console.log(`Syncing ${model} with action ${action}`);

    if (model === 'game_event') {
      // Do something
    }

    return Promise.resolve();
  }

  // Singleton
  private static _instance: CMSSyncService;
  public static get instance() {
    if (!CMSSyncService._instance) {
      CMSSyncService._instance = new CMSSyncService();
    }
    return CMSSyncService._instance;
  }
}
