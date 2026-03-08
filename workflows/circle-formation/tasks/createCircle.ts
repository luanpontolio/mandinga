/**
 * Call CircleFormationConsumer via CRE report + writeReport.
 * Follows Part 4: Writing Onchain — https://docs.chain.link/cre/getting-started/part-4-writing-onchain-ts
 *
 * Flow: encode report → runtime.report() → evmClient.writeReport(receiver=consumerAddress)
 * The consumer decodes and calls SavingsCircle.createCircle().
 */
import {
  EVMClient,
  getNetwork,
  hexToBase64,
  bytesToHex,
  type Runtime,
  TxStatus,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { alertOnFailure } from "../../lib/errorHandler.js";

const MIN_ROUND_DURATION_SEC = 60;

/** Report struct: (savingsCircle, poolSize, memberCount, roundDuration, minDepositPerRound) */
const REPORT_ABI_PARAMS = parseAbiParameters(
  "address savingsCircle, uint256 poolSize, uint16 memberCount, uint256 roundDuration, uint256 minDepositPerRound"
);

export type CreateCircleEvmConfig = {
  chainName: string;
  consumerAddress: string;
  savingsCircleAddress: string;
  gasLimit: string;
};

export async function createCircle(
  runtime: Runtime<{ evms?: CreateCircleEvmConfig[] }>,
  evmConfig: CreateCircleEvmConfig,
  poolSize: bigint,
  memberCount: number,
  roundDuration: bigint,
  minDepositPerRound: bigint
): Promise<boolean> {
  if (roundDuration < BigInt(MIN_ROUND_DURATION_SEC)) {
    runtime.log("[createCircle] roundDuration < 1 min — skipping");
    return false;
  }

  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainName,
  });

  if (!network) {
    runtime.log(`[createCircle] Unknown chain: ${evmConfig.chainName}`);
    return false;
  }

  const evmClient = new EVMClient(network.chainSelector.selector);

  const reportData = encodeAbiParameters(REPORT_ABI_PARAMS, [
    evmConfig.savingsCircleAddress as `0x${string}`,
    poolSize,
    memberCount,
    roundDuration,
    minDepositPerRound,
  ]);

  try {
    runtime.log(
      `[createCircle] Writing report: savingsCircle=${evmConfig.savingsCircleAddress}, poolSize=${poolSize}, memberCount=${memberCount}`
    );

    const reportResponse = runtime
      .report({
        encodedPayload: hexToBase64(reportData),
        encoderName: "evm",
        signingAlgo: "ecdsa",
        hashingAlgo: "keccak256",
      })
      .result();

    const writeReportResult = evmClient
      .writeReport(runtime, {
        receiver: evmConfig.consumerAddress as `0x${string}`,
        report: reportResponse,
        gasConfig: {
          gasLimit: evmConfig.gasLimit,
        },
      })
      .result();

    if (writeReportResult.txStatus === TxStatus.SUCCESS) {
      const txHash = bytesToHex(writeReportResult.txHash ?? new Uint8Array(32));
      runtime.log(`[createCircle] Write report succeeded: ${txHash}`);
      return !!txHash && txHash !== "0x";
    } else {
      runtime.log(`[createCircle] Write report failed: ${writeReportResult.txStatus}`);
      return false;
    }
  } catch (err) {
    alertOnFailure("createCircle", err, {
      consumerAddress: evmConfig.consumerAddress,
      savingsCircleAddress: evmConfig.savingsCircleAddress,
      poolSize: poolSize.toString(),
      memberCount,
      roundDuration: roundDuration.toString(),
    });
    return false;
  }
}
