import EnvVars from '@src/constants/EnvVars';
import {AirlyftService, AirlyftTokenResponse} from '@src/services/AirlyftService';

const INTERVAL_TIME = EnvVars.Airlyft.IntervalCronTime;
export async function getToken() {
  const response = await AirlyftService.instance.getDataToken<AirlyftTokenResponse>();
  if (response.success) {
    await AirlyftService.instance.setToken(response.token);
  }
}
if (INTERVAL_TIME > 0) {

  setInterval(() => {
    getToken().catch(console.error);
  }, INTERVAL_TIME );
}
