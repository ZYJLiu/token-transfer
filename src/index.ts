import { initializeKeypair } from "./initializeKeypair"
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
} from "@solana/web3.js"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  Account,
  getAccount,
  createTransferInstruction,
} from "@solana/spl-token"

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"))

  // Generate a new keypair to represent the sender
  const sender = await initializeKeypair(connection)

  // Generate a new keypair to represent the sender
  const receiver = Keypair.generate()

  // The MINT address of token to transfer
  const MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr")

  // Get the sender's associated token account address
  const senderTokenAccountAddress = await getAssociatedTokenAddress(
    MINT,
    sender.publicKey
  )

  // Get the receiver's associated token account address
  const receiverTokenAccountAddress = await getAssociatedTokenAddress(
    MINT,
    receiver.publicKey
  )

  // Create a new transaction
  const transaction = new Transaction()

  // Create an instruction to create the receiver's token account if it does not exist
  const createAccountInstruction = createAssociatedTokenAccountInstruction(
    sender.publicKey,
    receiverTokenAccountAddress,
    receiver.publicKey,
    MINT,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  // Check if the receiver's token account exists
  let receiverTokenAccount: Account
  try {
    receiverTokenAccount = await getAccount(
      connection,
      receiverTokenAccountAddress,
      "confirmed",
      TOKEN_PROGRAM_ID
    )
  } catch (e) {
    // If the account does not exist, add the create account instruction to the transaction
    transaction.add(createAccountInstruction)
  }

  // Create an instruction to transfer 1 token from the sender's token account to the receiver's token account
  const transferInstruction = await createTransferInstruction(
    senderTokenAccountAddress,
    receiverTokenAccountAddress,
    sender.publicKey,
    1
  )

  // Add the transfer instruction to the transaction
  transaction.add(transferInstruction)

  // Send the transaction signed by the sender
  const transactionSignature = await connection.sendTransaction(transaction, [
    sender,
  ])

  console.log(transactionSignature)
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
