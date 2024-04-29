import {AccountService} from '@src/services/AccountService';


const accountList = [{
  address: '5Eo5BJntLSFRYGjzEedEguxVjH7dxo1iEXUCgXJEP2bFNHSo',
  signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
  telegramId: 12345699909987,
  telegramUsername: 'first_user',
  firstName: 'First',
  lastName: 'User',
  photoUrl: 'https://via.placeholder.com/300x300',
  languageCode: 'en',
}, {
  address: '5C56a7RAa81CkeFmJFPZmCfXwZ4YALxt6Sx2L5KmF6vos84p',
  signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
  telegramId: 1234569990998,
  telegramUsername: 'second_user',
  firstName: 'Second',
  lastName: 'User',
  photoUrl: 'https://via.placeholder.com/300x300',
  languageCode: 'en',
}, {
  address: '5C56a7RAa81CkeFmJFPZmCfXwZ4YALxs6Sx2L5KmF6vos84p',
  signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
  telegramId: 1234569390998,
  telegramUsername: 'third_user',
  firstName: 'Third',
  lastName: 'User',
  photoUrl: 'https://via.placeholder.com/300x300',
  languageCode: 'en',
}];

const accountService = AccountService.instance;

export async function createSampleAccounts() {
  return await Promise.all(accountList.map(async (account) => {
    return await accountService.createAccount(account);
  }));
}