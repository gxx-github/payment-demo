require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bs58 = require('bs58');
const {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const {
    getAssociatedTokenAddress,
    createTransferInstruction,
    createAssociatedTokenAccountInstruction,
    getAccount,
    TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');

const app = express();
app.use(cors());
app.use(express.json());

const connection = new Connection(process.env.SOLANA_RPC || 'process.env.SOLANA_RPC', 'confirmed');

// 加载 payer（不变）
let payer;
try {
    const secretKeyStr = process.env.PAYER_SECRET_KEY;
    if (secretKeyStr.startsWith('[')) {
        const payerSecretKey = JSON.parse(secretKeyStr);
        payer = Keypair.fromSecretKey(new Uint8Array(payerSecretKey));
    } else {
        const payerSecretKeyBytes = bs58.decode(secretKeyStr);
        payer = Keypair.fromSecretKey(payerSecretKeyBytes);
    }
} catch (error) {
    console.error('私钥加载失败:', error.message);
    process.exit(1);
}

const userPublicKey = new PublicKey(process.env.USER_PUBLIC_KEY);
const usdcMint = new PublicKey(process.env.USDC_MINT);
const targetPublicKey = new PublicKey(process.env.TARGET_PUBLIC_KEY);

// Memo 程序 ID（新版，不需要签名）
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

console.log('环境变量检查:');
console.log('USER_PUBLIC_KEY:', process.env.USER_PUBLIC_KEY);
console.log('TARGET_PUBLIC_KEY:', process.env.TARGET_PUBLIC_KEY);
console.log('USDC_MINT:', process.env.USDC_MINT);
console.log('用户公钥对象:', userPublicKey.toString());
console.log('目标公钥对象:', targetPublicKey.toString());

/**
 * 创建 Memo 指令（标准格式）
 * @param {string} memoText - Memo 文本内容
 * @param {PublicKey} signer - 可选，签名者账户（用于标识）
 * @returns {TransactionInstruction}
 */
function createMemoInstruction(memoText, signer = null) {
    const keys = [];

    // 如果提供了签名者，添加到 keys 中（虽然不是必需，但有助于钱包识别）
    if (signer) {
        keys.push({
            pubkey: signer,
            isSigner: false,  // Memo 不需要签名，但包含账户信息有助于钱包识别
            isWritable: false
        });
    }

    // 使用 TransactionInstruction 创建标准格式的指令
    return new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: keys,
        data: Buffer.from(memoText, 'utf8')
    });
}

// API 1: 构造 TX (无 sign)
app.post('/api/construct-tx', async (req, res) => {
    try {
        const { memo } = req.body; // 从请求中获取 memo（可选）

        const userATA = await getAssociatedTokenAddress(usdcMint, userPublicKey);
        const targetATA = await getAssociatedTokenAddress(usdcMint, targetPublicKey);

        // 检查 ATA（不变）
        let userATAExists = true;
        try {
            await getAccount(connection, userATA);
        } catch (error) {
            userATAExists = false;
            console.log('用户 ATA 不存在，将创建');
        }

        let targetATAExists = true;
        try {
            await getAccount(connection, targetATA);
        } catch (error) {
            targetATAExists = false;
            console.log('目标 ATA 不存在，将创建');
        }

        const transaction = new Transaction();

        if (!userATAExists) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    payer.publicKey,
                    userATA,
                    userPublicKey,
                    usdcMint
                )
            );
        }

        if (!targetATAExists) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    payer.publicKey,
                    targetATA,
                    targetPublicKey,
                    usdcMint
                )
            );
        }

        const transferInstruction = createTransferInstruction(
            userATA,
            targetATA,
            userPublicKey,
            100_000,
            [],
            TOKEN_PROGRAM_ID
        );
        transaction.add(transferInstruction);

        // 如果提供了 memo，添加 memo 指令
        if (memo && typeof memo === 'string' && memo.trim().length > 0) {
            // Memo 文本最大长度为 566 字节（UTF-8）
            const memoText = memo.trim();
            if (Buffer.from(memoText, 'utf8').length > 566) {
                throw new Error('Memo 文本过长，最大支持 566 字节');
            }
            const memoInstruction = createMemoInstruction(memoText, userPublicKey);
            transaction.add(memoInstruction);
            console.log('已添加 Memo 指令:', memoText);
        }

        // 打印指令详情
        console.log('交易指令详情:');
        transaction.instructions.forEach((instruction, index) => {
            console.log(`指令 ${index}: ProgramId=${instruction.programId.toString()}`);
            instruction.keys.forEach((key, kIndex) => {
                console.log(`  Key ${kIndex}: pubkey=${key.pubkey.toString()}, isSigner=${key.isSigner}, isWritable=${key.isWritable}`);
            });
        });

        transaction.feePayer = payer.publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        console.log('Partial TX 准备好，用户签名前签名数量: 0');

        const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');
        console.log(JSON.stringify(serializedTx, null, 2));
        res.json({
            serializedTx,
            blockhash,
            userPubkey: userPublicKey.toString(),
            userATA: userATA.toString(),
            targetATA: targetATA.toString(),
            createdUserATA: !userATAExists,
            createdTargetATA: !targetATAExists,
            memo: memo && typeof memo === 'string' && memo.trim().length > 0 ? memo.trim() : null  // 返回 memo（如果有）
        });
    } catch (error) {
        console.error('构造交易错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// API 2: User signed TX -> partialSign payer -> broadcast (fallback raw serialize)
app.post('/api/sponsor-tx', async (req, res) => {
    try {
        const { serializedTx } = req.body;
        console.log(JSON.stringify(serializedTx, null, 2));
        // 调用本地接口


        const response = await fetch('http://localhost:8080/api/signTx', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                serializedTx: serializedTx
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `后端请求失败: ${response.status}`);
        }

        const result = await response.json();
        console.log('本地接口返回结果:', result);



        // callLocalWithFetch();
        let tx = Transaction.from(Buffer.from(serializedTx, 'base64'));

        console.log('User signed TX 分析:');
        console.log('指令数量:', tx.instructions.length);
        console.log('签名数量:', tx.signatures.length);
        console.log('FeePayer:', tx.feePayer.toString());

        // 检查 memo 指令
        const memoInstructions = tx.instructions.filter(instruction =>
            instruction.programId.equals(MEMO_PROGRAM_ID)
        );
        if (memoInstructions.length > 0) {
            console.log(`发现 ${memoInstructions.length} 个 memo 指令`);
            memoInstructions.forEach((memo, index) => {
                const memoText = memo.data.toString('utf8');
                console.log(`Memo ${index}: "${memoText}"`);
            });
        }

        // 只过滤旧版 memo 指令（需要签名的），保留新版 memo（不需要签名）
        const oldMemoId = new PublicKey('D9memo1QHCRzVPpwYSWZPuGMuawEX3hKUMSGkNED1y5Q');
        const originalInstructionCount = tx.instructions.length;
        tx.instructions = tx.instructions.filter(instruction =>
            !instruction.programId.equals(oldMemoId)  // 只过滤旧版 memo
        );
        if (tx.instructions.length !== originalInstructionCount) {
            console.log(`过滤了 ${originalInstructionCount - tx.instructions.length} 个旧版 memo 指令`);
        }
        console.log('最终指令数量:', tx.instructions.length);

        // 尝试 repopulate message
        let message = null;
        try {
            message = Transaction.populateMessage(
                tx.instructions,
                tx.message.header,
                tx.message.accountKeys,
                tx.message.recentBlockhash
            );
            console.log('Repopulate message 成功, numRequiredSignatures=', message.header.numRequiredSignatures);
        } catch (error) {
            console.log('Repopulate message 失败，使用 fallback raw TX');
            message = tx.message;  // 保留原 message
        }

        tx.message = message;

        // 再次检查 memo 是否还在（populateMessage 后）
        const memoAfterRepopulate = tx.instructions.filter(instruction =>
            instruction.programId.equals(MEMO_PROGRAM_ID)
        );
        if (memoAfterRepopulate.length > 0) {
            console.log(`Repopulate 后仍有 ${memoAfterRepopulate.length} 个 memo 指令`);
        } else if (memoInstructions.length > 0) {
            console.log('警告: Repopulate 后 memo 指令丢失！');
        }

        // console.log(JSON.stringify(tx, null, 2));

        /*
        // Partial sign payer
        tx.partialSign(payer);
        console.log('Payer partial sign 后签名数量:', tx.signatures.length);



        // 广播 (fallback raw serialize if message issue)
        let rawTx = null;
        try {
            rawTx = tx.serialize();
        } catch (error) {
            console.log('serialize 失败，使用 fallback');
            rawTx = tx.serialize({ requireAllSignatures: false });  // partial fallback
        }
        // console.log('最终广播的 rawTx ', rawTx);

        const signature = await connection.sendRawTransaction(
            rawTx,
            {
                skipPreflight: true,
                preflightCommitment: 'confirmed'
            }
        );

        await connection.confirmTransaction(signature, 'confirmed');

        console.log('广播成功！签名:', signature);
        res.json({
            signature,
            explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=mainnet`
        });
*/

    } catch (error) {
        console.error('广播交易错误:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`后端运行在 http://localhost:${PORT} (Mainnet USDC 0.1U, fallback raw)`);
    console.log('Payer 公钥:', payer.publicKey.toString());
});