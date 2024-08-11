import { ethers } from "ethers";
import FACTORY_ABI from "./abis/factory.json" assert { type: "json" };
import SWAP_ROUTER_ABI from "./abis/swaprouter.json" assert { type: "json" };
import POOL_ABI from "./abis/pool.json" assert { type: "json" };
import TOKEN_IN_ABI from "./abis/token.json" assert { type: "json" };
import BALANCER_POOL_ABI from "./abis/balancerPool.json" assert { type: "json" }; // Balancer Pool ABI

import dotenv from "dotenv";
dotenv.config();

// Contract Addresses
const POOL_FACTORY_CONTRACT_ADDRESS = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
const SWAP_ROUTER_CONTRACT_ADDRESS = ethers.getAddress("0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E");
const BALANCER_POOL_ADDRESS = "0x9fC9e94C0DdC148f8D4c47c9b1dD78Fbb5e40F4D"; // Replace with actual address

// Initialize Provider and Signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const factoryContract = new ethers.Contract(POOL_FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, provider);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Token Configuration
const USDC = {
  chainId: 11155111,
  address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  decimals: 6,
  symbol: "USDC",
  name: "USD//C",
  isToken: true,
  isNative: true,
  wrapped: false,
};

const LINK = {
  chainId: 11155111,
  address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  decimals: 18,
  symbol: "LINK",
  name: "Chainlink",
  isToken: true,
  isNative: true,
  wrapped: false,
};

// Approve Token Function
async function approveToken(tokenAddress, tokenABI, amount, wallet) {
  try {
    // Normalize the token address
    const normalizedTokenAddress = ethers.getAddress(tokenAddress);
    
    const tokenContract = new ethers.Contract(normalizedTokenAddress, tokenABI, wallet);
    const approveAmount = ethers.parseUnits(amount.toString(), USDC.decimals);
    const approveTransaction = await tokenContract.approve.populateTransaction(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      approveAmount
    );
    const transactionResponse = await wallet.sendTransaction(
      approveTransaction
    );
    console.log(`-------------------------------`);
    console.log(`Sending Approval Transaction...`);
    console.log(`-------------------------------`);
    console.log(`Transaction Sent: ${transactionResponse.hash}`);
    console.log(`-------------------------------`);
    const receipt = await transactionResponse.wait();
    console.log(
      `Approval Transaction Confirmed! https://sepolia.etherscan.io/tx/${receipt.hash}`
    );
  } catch (error) {
    console.error("An error occurred during token approval:", error);
    throw new Error("Token approval failed");
  }
}


// Get Pool Info Function
async function getPoolInfo(factoryContract, tokenIn, tokenOut) {
  const poolAddress = await factoryContract.getPool(
    tokenIn.address,
    tokenOut.address,
    3000
  );
  if (!poolAddress) {
    throw new Error("Failed to get pool address");
  }
  const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);
  return { poolContract, token0, token1, fee };
}

// Prepare Swap Params Function
async function prepareSwapParams(poolContract, signer, amountIn) {
  return {
    tokenIn: USDC.address,
    tokenOut: LINK.address,
    fee: await poolContract.fee(),
    recipient: signer.address,
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };
}

// Execute Swap Function
async function executeSwap(swapRouter, params, signer) {
  try {
    // Log the parameters
    console.log("Swap Params:", params);

    // Estimate gas
    const estimatedGas = await swapRouter.estimateGas.exactInputSingle(params);
    console.log("Estimated Gas:", estimatedGas.toString());

    // Create transaction
    const tx = await swapRouter.exactInputSingle.populateTransaction(params);

    // Send transaction
    const receipt = await signer.sendTransaction(tx);
    console.log(`-------------------------------`);
    console.log(`Receipt: https://sepolia.etherscan.io/tx/${receipt.hash}`);
    console.log(`-------------------------------`);

  } catch (error) {
    console.error("An error occurred during swap execution:", error);
    throw new Error("Swap execution failed");
  }
}


// Balancer Integration Functions

// Approve LP Tokens for Staking in Balancer
async function approveBalancerLPToken(tokenAddress, amount, wallet) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_IN_ABI, wallet);
    const approveAmount = ethers.parseUnits(amount.toString(), LINK.decimals); // Assuming LINK LP tokens
    const approveTransaction = await tokenContract.approve.populateTransaction(
      BALANCER_POOL_ADDRESS,
      approveAmount
    );
    const transactionResponse = await wallet.sendTransaction(approveTransaction);
    console.log(`Approval Transaction Sent: ${transactionResponse.hash}`);
    const receipt = await transactionResponse.wait();
    console.log(
      `LP Token Approval Confirmed! https://sepolia.etherscan.io/tx/${receipt.hash}`
    );
  } catch (error) {
    console.error("An error occurred during LP token approval:", error);
    throw new Error("LP token approval failed");
  }
}

// Add Liquidity to Balancer Pool
async function addLiquidityToBalancerPool(amount, maxAmountsIn) {
  try {
    const balancerPoolContract = new ethers.Contract(BALANCER_POOL_ADDRESS, BALANCER_POOL_ABI, signer);
    const joinTransaction = await balancerPoolContract.joinPool(
      amount,
      maxAmountsIn
    );
    console.log(`Adding Liquidity Transaction Sent: ${joinTransaction.hash}`);
    const receipt = await joinTransaction.wait();
    console.log(
      `Liquidity Added Successfully! https://sepolia.etherscan.io/tx/${receipt.hash}`
    );
  } catch (error) {
    console.error("An error occurred while adding liquidity:", error);
    throw new Error("Adding liquidity failed");
  }
}

// Main Function
async function main(swapAmount, liquidityAmount) {
  const inputAmount = swapAmount;
  const amountIn = ethers.parseUnits(inputAmount.toString(), USDC.decimals);

  try {
    // Approve and swap USDC for LINK
    await approveToken(USDC.address, TOKEN_IN_ABI, inputAmount, signer);
    const { poolContract } = await getPoolInfo(factoryContract, USDC, LINK);
    const params = await prepareSwapParams(poolContract, signer, amountIn);
    const swapRouter = new ethers.Contract(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      SWAP_ROUTER_ABI,
      signer
    );
    await executeSwap(swapRouter, params, signer);

    // Approve and add liquidity to Balancer pool
    await approveBalancerLPToken(LINK.address, liquidityAmount, signer);
    await addLiquidityToBalancerPool(liquidityAmount, [liquidityAmount]); // Adjust the maxAmountsIn parameter as needed
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

// Enter Swap and Liquidity Amounts
main(1, 0.5);
