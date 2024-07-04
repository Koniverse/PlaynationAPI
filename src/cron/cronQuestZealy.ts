// import EnvVars from '@src/constants/EnvVars';
// import {ZealyActionRoutes, AirlyftService} from '@src/services/AirlyftService';
// import {ResponseZealy} from '@src/types';
// import {Account, Task, ZealyEvent} from '@src/models';
// import {TaskService} from '@src/services/TaskService';
//
// const INTERVAL_TIME = EnvVars.Zealy.IntervalCronTime;
//
// export async function checkQuest() {
//   const taskZealySync = EnvVars.Zealy.TaskZealySync;
//   const dataQuest = await AirlyftService.instance.addAction<ResponseZealy>(ZealyActionRoutes.ReviewQuest, 'v2', 'GET', {
//     questId: taskZealySync,
//     status: 'pending',
//   });
//   const task = await Task.findOne({
//     where: {
//       zealyId: taskZealySync,
//       zealyType: 'sync',
//     },
//   });
//   if (!task) {
//     return;
//   }
//   if (dataQuest) {
//     const {items} = dataQuest;
//     if (items.length === 0) {
//       return;
//     }
//     const claimSuccessIds = [];
//     const claimFailIds = [];
//     for (const item of items) {
//       const {user, tasks, id} = item;
//       const taskValue = tasks.find((task) => task.type === 'text' && task.status === 'in-review');
//       if (!taskValue) {
//         continue;
//       }
//       const zealyEvent = await ZealyEvent.findOne({
//         where: {
//           claimId: id,
//         },
//       });
//       if (zealyEvent) {
//         continue;
//       }
//       const value = taskValue.value;
//       const account = await Account.findOne({
//         where: {
//           address: value,
//         },
//       });
//       if (account) {
//         account.zealyId = user.id;
//         await account.save();
//         claimSuccessIds.push(id);
//         await TaskService.instance.createTaskHistory(task.id, account.id);
//       } else {
//         claimFailIds.push(id);
//       }
//     }
//
//
//     if (claimFailIds.length > 0) {
//       const dataReview = {
//         status: 'fail',
//         claimedQuestIds: claimFailIds,
//         comment: 'Auto validate',
//       };
//       await AirlyftService.instance.addAction(ZealyActionRoutes.ClaimedQuestsReview, 'v1', 'POST', dataReview);
//     }
//
//
//     if (claimSuccessIds.length > 0) {
//       const dataReview = {
//         status: 'success',
//         claimedQuestIds: claimSuccessIds,
//         comment: 'Auto validate',
//       };
//       await AirlyftService.instance.addAction(ZealyActionRoutes.ClaimedQuestsReview, 'v1', 'POST', dataReview);
//     }
//   }
//   return dataQuest;
// }
// if (INTERVAL_TIME > 0) {
//
//   setInterval(() => {
//     checkQuest().catch(console.error);
//   }, INTERVAL_TIME );
// }
