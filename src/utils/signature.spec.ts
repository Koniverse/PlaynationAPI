import {validateSignature} from '@src/utils/signature';
import {cryptoWaitReady, signatureVerify} from '@polkadot/util-crypto';


describe('Test Signature', () => {

  beforeAll(async () => {
    await cryptoWaitReady();
  });
  it('validate substrate signature', function () {
    // Validate right signature
    expect(validateSignature(
      '5Cqz2YEo6g8izJ7TFKQQt3Mn8XxQ82DF26KXKrSQLXAXR7kd',
      'Sign Message',
      '0x0293a5254ec579ad0571bd64e6f51ce4fea22860e43e2dc5dc411c73f8d05919ea1d0bb7cfc384056b4ffcef403c3df2f30aeacbbd5bb61ad5946be1aea3528c'),
    ).toBe(true);
    
    // Validate wrong address
    expect(validateSignature(
      '5Cqz2YEo6g8izJ7TFKQQt3Mn8XxQ82DF26KXKrSQLXA7kd',
      'Sign Message',
      '0x0293a5254ec579ad0571bd64e6f51ce4fea22860e43e2dc5dc411c73f8d05919ea1d0bb7cfc384056b4ffcef403c3df2f30aeacbbd5bb61ad5946be1aea3528c'),
    ).toBe(false);

    
    // Validate wrong message
    expect(validateSignature(
      '5Cqz2YEo6g8izJ7TFKQQt3Mn8XxQ82DF26KXKrSQLXAXR7kd',
      'Sign Message x',
      '0x0293a5254ec579ad0571bd64e6f51ce4fea22860e43e2dc5dc411c73f8d05919ea1d0bb7cfc384056b4ffcef403c3df2f30aeacbbd5bb61ad5946be1aea3528c'),
    ).toBe(false);
    
    // Todo: Validate wrong signature
    expect(validateSignature(
      '5Cqz2YEo6g8izJ7TFKQQt3Mn8XxQ82DF26KXKrSQLXAXR7kd',
      'Sign Message x',
      '0x0293a5254ec579ad0571bd64e6f51ce4fea22860e43e2dc5dc411c73f8d05919ea1d0bb7cfc384056b4ffcef403c3df2f30aeacbbd5bb61ad5946be1aea35280'),
    ).toBe(false);
  });

  it('validate evm signature', function () {
    // Validate right signature
    expect(validateSignature(
      '0x2D3051BC4Ed05aE74AcB53Bff8034252C3F43755',
      'Simple Message',
      '0xb25445d7da3c7e8d79ab1e3654008cda674d4d56d4889c09abce1cd504c75b16281a7e3db5edc186005cd62232b105b0167d3f02dcea30467b242f02f63cfeb61c',
    )).toBe(true);

    // Validate wrong address
    expect(validateSignature(
      '0x2D3051BC4Ed05aE74AcB53Bff8034252C3F4375',
      'Simple Message',
      '0xb25445d7da3c7e8d79ab1e3654008cda674d4d56d4889c09abce1cd504c75b16281a7e3db5edc186005cd62232b105b0167d3f02dcea30467b242f02f63cfeb61c',
    )).toBe(false);

    // Validate wrong signature
    expect(validateSignature(
      '0x2D3051BC4Ed05aE74AcB53Bff8034252C3F43755',
      'Simple Message',
      '0xb254da3c7e8d79ab1e3654008cda674d4d56d4889c09abce1cd504c75b16281a7e3db5edc186005cd62232b105b0167d3f02dcea30467b242f02f63cfeb61c',
    )).toBe(false);

    // Validate wrong message
    expect(validateSignature(
      '0x2D3051BC4Ed05aE74AcB53Bff8034252C3F43755',
      'Simple essage',
      '0xb254da3c7e8d79ab1e3654008cda674d4d56d4889c09abce1cd504c75b16281a7e3db5edc186005cd62232b105b0167d3f02dcea30467b242f02f63cfeb61c',
    )).toBe(false);
  });
});