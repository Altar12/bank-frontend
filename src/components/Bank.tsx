// TODO: SignMessage
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { FC, Fragment, useState } from 'react';
import { Program, AnchorProvider, utils, BN } from '@project-serum/anchor';
import idl from './bank.json';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programId = new PublicKey(idl.metadata.address);

type Bank = {
    name: string,
    balance: BN,
    owner: PublicKey,
};

export const Bank: FC = () => {
    const ourWallet = useWallet();
    const { publicKey } = ourWallet
    const { connection } = useConnection();

    const [banks, setBanks] = useState([])

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions())
        return provider
    }

    const createBank = async () => {
        try {
            const anchProvider = getProvider()
            const program = new Program(idl_object, programId, anchProvider)

            const [bank] = PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode("user_bank"),
                anchProvider.wallet.publicKey.toBuffer()
            ], program.programId)

            await program.methods.create("My Bank")
                                 .accounts({
                                    user: anchProvider.wallet.publicKey,
                                    bank,
                                 })
                                 .rpc()
            
            console.log("New bank created:", bank.toString())
        } catch (error) {
            console.log("Error while creating bank:", error)
        }
    }

    const getBanks = async () => {
        const anchProvider = getProvider()
        const program = new Program(idl_object, programId, anchProvider)
        try {
            Promise.all((await connection.getProgramAccounts(programId)).map(async bank => ({
                ...(await program.account.bank.fetch(bank.pubkey)),
                pubkey: bank.pubkey
            }))).then(banks => {
                console.log(banks)
                setBanks(banks)
            })
        } catch (error) {
            console.error("Error while getting the banks")
        }
    }

    const depositBank = async (bank: PublicKey) => {
        try {
            const anchProvider = getProvider()
            const program = new Program(idl_object, programId, anchProvider)

            await program.methods.deposit(new BN(0.1 * LAMPORTS_PER_SOL))
                                .accounts({
                                    user: anchProvider.publicKey,
                                    bank,
                                })
                                .rpc()
            console.log("Deposit done:", bank.toBase58())
        } catch (error) {
            console.error("Error while depositing:", error)
        }
    }

    const withdrawBank = async (bank: PublicKey) => {
        try {
            const anchProvider = getProvider()
            const program = new Program(idl_object, programId, anchProvider)
            const bankInfo = await program.account.bank.fetch(bank) as Bank
            await program.methods.withdraw(bankInfo.balance)
                                .accounts({
                                    user: anchProvider.publicKey,
                                    bank,
                                })
                                .rpc()
            console.log("Deposit done:", bank.toBase58())
        } catch (error) {
            console.error("Error while depositing:", error)
        }
    }

    return (
        <Fragment>
            {banks.map((bank, index) => {
                return(
                    <div key = {index} className="md:hero-content flex flex-col">
                        <h1>{bank.name.toString()}</h1>
                        <span>{bank.balance.toString()}</span>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={() => depositBank(bank.pubkey)} disabled={!publicKey}
                            >
                            <span>Deposit 0.1</span>
                        </button>
                        {
                            bank.owner.toString() === ourWallet.publicKey.toString() &&
                            <button
                                className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                onClick={() => withdrawBank(bank.pubkey)} disabled={!publicKey}
                            >
                            <span>Withdraw</span>
                        </button>
                        }
                        </div>
                )
            })}
        <div className="flex flex-row justify-center">
            <Fragment>
            <div className="relative group items-center">
                
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={createBank} disabled={!publicKey}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        Create Bank
                    </span>
                </button>

                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={getBanks} disabled={!publicKey}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        Fetch Banks
                    </span>
                </button>
            </div>
            </Fragment>
        </div>
        </Fragment>
    );
};
