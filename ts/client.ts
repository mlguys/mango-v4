import { Program, Provider } from '@project-serum/anchor';
import { PublicKey, TransactionSignature } from '@solana/web3.js';
import { Bank, getBanksForGroup } from './accounts/types/bank';
import { getGroupForAdmin, Group } from './accounts/types/group';
import {
  createMangoAccount,
  getMangoAccountsForGroupAndOwner,
  MangoAccount,
} from './accounts/types/mangoAccount';
import { IDL, MangoV4 } from './mango_v4';

export const MANGO_V4_ID = new PublicKey(
  'm43thNJ58XCjL798ZSq6JGAG1BnWskhdq5or6kcnfsD',
);

export class MangoClient {
  constructor(public program: Program<MangoV4>, public devnet?: boolean) {}

  static async connect(
    provider: Provider,
    devnet?: boolean,
  ): Promise<MangoClient> {
    // TODO: use IDL on chain or in repository? decide...
    // Alternatively we could fetch IDL from chain.
    // const idl = await Program.fetchIdl(MANGO_V4_ID, provider);
    let idl = IDL;

    // TODO: remove...
    // Temporarily add missing (dummy) type definitions, so we can do new Program(...) below
    // without anchor throwing errors. These types come from part of the code we don't yet care about
    // in the client.
    function addDummyType(idl: MangoV4, typeName: string) {
      if (idl.types.find((type) => type.name === typeName)) {
        return;
      }
      (idl.types as any).push({
        name: typeName,
        type: {
          kind: 'struct',
          fields: [],
        },
      });
    }
    addDummyType(idl, 'usize');
    addDummyType(idl, 'AnyNode');
    addDummyType(idl, 'EventQueueHeader');
    addDummyType(idl, 'AnyEvent');
    addDummyType(idl, 'H');
    addDummyType(idl, 'H::Item');
    addDummyType(idl, 'NodeHandle');

    return new MangoClient(
      new Program<MangoV4>(idl as MangoV4, MANGO_V4_ID, provider),
      devnet,
    );
  }

  public async getGroup(adminPk: PublicKey): Promise<Group> {
    return await getGroupForAdmin(this, adminPk);
  }

  public async getBanksForGroup(group: Group): Promise<Bank[]> {
    return await getBanksForGroup(this, group.publicKey);
  }

  public async createMangoAccount(
    group: Group,
    ownerPk: PublicKey,
    accountNumber: number,
  ): Promise<TransactionSignature> {
    return createMangoAccount(this, group.publicKey, ownerPk, accountNumber);
  }

  public async getMangoAccount(
    group: Group,
    ownerPk: PublicKey,
  ): Promise<MangoAccount[]> {
    return await getMangoAccountsForGroupAndOwner(
      this,
      group.publicKey,
      ownerPk,
    );
  }

  // public async deposit(group: Group, mangoAccount: MangoAccount, bank: Bank) {
  //   return await deposit(
  //     this,
  //     group.publicKey,
  //     mangoAccount.publicKey,
  //     bank.publicKey,
  //     bank.vault,
  //     tokenAccountPk,
  //     ownerPk,
  //   );
  // }
}
