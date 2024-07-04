import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AirlyftService} from '@src/services/AirlyftService';
import {WebhookZealy} from '@src/types';

const AirlyftRouter = Router();

const airlyftService = AirlyftService.instance;
import { ApolloClient, InMemoryCache, ApolloProvider, gql, createHttpLink } from '@apollo/client';
const routerMap = {
  
  webhookZealy: async (req: IReq<WebhookZealy>, res: IRes) => {
    const body = req.body;
    await airlyftService.webhookZealyAsync(body);
    return res.status(200).json({});
  },

  test: async (req: IReq<Query>, res: IRes) => {
    // const data = await checkQuest();
    const url = 'https://fuel.airlyft.one/graphql';
    const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiMGM0MDJmMy05MTI2LTQ4MWUtOGUwNS00OWQ2YTE4NmMxMWQiLCJwcm92aWRlcklkIjoiMHg5YTI0YjY3OGNhNTkwODJhOWI4MzE1YzgxMTM5MjMxMDEwY2Y0MTY5IiwicHJvdmlkZXIiOiJFVk1fQkxPQ0tDSEFJTiIsImlhdCI6MTcyMDAwMTg2NSwiZXhwIjoxNzIwMDg4MjY1fQ.TYIour0IxSye79utN31LxFebCUQBY4kv7HDP2cvNke8';
    const httpLink = createHttpLink({
      uri: url,
      headers: {
        authorization: token ,
      },
    });
    
    const params = {
      'eventId': '551f5de8-30ce-4bb7-b5aa-dc7d4e42172f',
      'projectId': '2dcae85b-b737-43b7-a15c-289bee8d7540',
      'taskId': '2694d19c-c0c8-400f-8934-77539c66e288',
    };

    const query = gql`
      query Tasks($eventId: ID!) {
  tasks(eventId: $eventId) {
    createdAt, 
    id,
    title,
  }
}
    `;

    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: httpLink,
    });
    const data = await client.query({query, variables: params});
    return res.status(200).json(data);
  },
};
AirlyftRouter.post('/webhook', routerMap.webhookZealy);
AirlyftRouter.get('/test', routerMap.test);

export default AirlyftRouter;
