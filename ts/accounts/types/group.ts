import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { MangoClient } from '../../client';
import {
  DEVNET_MINTS_REVERSE,
  DEVNET_SERUM3_MARKETS_REVERSE,
} from '../../constants';
import { Bank } from './bank';
import { Serum3Market } from './serum3';

export class Group {
  static from(publicKey: PublicKey, obj: { admin: PublicKey }): Group {
    return new Group(publicKey, obj.admin, new Map(), new Map());
  }

  constructor(
    public publicKey: PublicKey,
    public admin: PublicKey,
    public banksMap: Map<string, Bank>,
    public serum3MarketsMap: Map<string, Serum3Market>,
  ) {}

  public findBank(tokenIndex: number): Bank | undefined {
    return Array.from(this.banksMap.values()).find(
      (bank) => bank.tokenIndex === tokenIndex,
    );
  }

  public async reload(client: MangoClient) {
    await this.reloadBanks(client);
    await this.reloadSerum3Markets(client);
  }

  public async reloadBanks(client: MangoClient) {
    const banks = await client.getBanksForGroup(this);
    this.banksMap = new Map(
      banks.map((bank) => [DEVNET_MINTS_REVERSE[bank.mint.toBase58()], bank]),
    );
  }

  public async reloadSerum3Markets(client: MangoClient) {
    const serum3Markets = await client.serum3GetMarket(this);
    this.serum3MarketsMap = new Map(
      serum3Markets.map((serum3Market) => [
        DEVNET_SERUM3_MARKETS_REVERSE[
          serum3Market.serumMarketExternal.toBase58()
        ],
        serum3Market,
      ]),
    );
  }
}

/**
 * @deprecated
 */
export async function createGroup(
  client: MangoClient,
  adminPk: PublicKey,
): Promise<TransactionSignature> {
  const tx = new Transaction();
  const ix = await createGroupIx(client, adminPk);
  tx.add(ix);
  return await client.program.provider.send(tx);
}

/**
 * @deprecated
 */
export async function createGroupIx(
  client: MangoClient,
  adminPk: PublicKey,
): Promise<TransactionInstruction> {
  return await client.program.methods
    .createGroup()
    .accounts({
      admin: adminPk,
      payer: adminPk,
    })
    .instruction();
}

/**
 * @deprecated
 */
export async function getGroupForAdmin(
  client: MangoClient,
  adminPk: PublicKey,
): Promise<Group> {
  const groups = (
    await client.program.account.group.all([
      {
        memcmp: {
          bytes: adminPk.toBase58(),
          offset: 8,
        },
      },
    ])
  ).map((tuple) => Group.from(tuple.publicKey, tuple.account));
  return groups[0];
}