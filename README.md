## Overview of the Script

This script performs a series of decentralized finance (DeFi) actions using various protocols. It interacts with Uniswap V3 and Balancer protocols to swap tokens and manage liquidity. Here's a detailed description of the script:

#### 1. **Initialization**

- **Provider and Signer**: Sets up the Ethereum provider and wallet using `ethers.js`. The provider connects to the Sepolia test network, and the wallet is initialized with a private key for transaction signing.
- **Contract Addresses**: Defines the contract addresses for the Uniswap V3 pool factory, swap router, and Balancer pool.

#### 2. **Token Configuration**

- **USDC and LINK**: Defines the token details, including their addresses, decimals, symbols, and other attributes.

#### 3. **Approve Token Function**

- **Purpose**: Approves the Uniswap V3 swap router to spend a specified amount of the token (e.g., USDC) on behalf of the user.
- **Process**:
  1. Creates a transaction to approve the swap router contract.
  2. Sends the approval transaction and waits for it to be confirmed.

#### 4. **Get Pool Info Function**

- **Purpose**: Retrieves the address of the Uniswap V3 pool and relevant details.
- **Process**:
  1. Queries the factory contract to get the pool address.
  2. Instantiates the pool contract and retrieves token addresses and fee information.

#### 5. **Prepare Swap Params Function**

- **Purpose**: Prepares the parameters for the swap operation.
- **Process**:
  1. Retrieves the pool fee.
  2. Constructs the parameters for the swap transaction.

#### 6. **Execute Swap Function**

- **Purpose**: Executes the token swap using the Uniswap V3 swap router.
- **Process**:
  1. Estimates the gas required for the swap.
  2. Creates and sends the swap transaction.
  3. Waits for the transaction to be confirmed.

#### 7. **Balancer Integration Functions**

- **Approve LP Tokens**: Approves the Balancer pool contract to spend a specified amount of LP tokens (e.g., LINK).
- **Add Liquidity**: Adds liquidity to the Balancer pool using the approved LP tokens.

#### 8. **Main Function**

- **Purpose**: Orchestrates the entire process.
- **Process**:
  1. Approves USDC for swapping.
  2. Retrieves pool information and prepares swap parameters.
  3. Executes the swap from USDC to LINK.
  4. Approves LINK LP tokens for liquidity.
  5. Adds liquidity to the Balancer pool.

### Diagram Illustration

Below is a flowchart that illustrates the sequence of steps and interactions between the DeFi protocols:

```plaintext
+-------------------------+
| Initialize Provider &   |
| Signer                  |
+-------------------------+
            |
            v
+-------------------------+
| Define Token Addresses  |
+-------------------------+
            |
            v
+-------------------------+
| Approve Token           |
| for Swap Router         |
+-------------------------+
            |
            v
+-------------------------+
| Get Pool Information    |
| from Uniswap Factory    |
+-------------------------+
            |
            v
+-------------------------+
| Prepare Swap Parameters |
+-------------------------+
            |
            v
+-------------------------+
| Execute Swap            |
| on Uniswap V3 Router    |
+-------------------------+
            |
            v
+-------------------------+
| Approve LP Tokens       |
| for Balancer            |
+-------------------------+
            |
            v
+-------------------------+
| Add Liquidity           |
| to Balancer Pool        |
+-------------------------+
```

### Key Points

- **Approval Transactions**: Necessary for authorizing spending of tokens by other contracts.
- **Uniswap V3 Swap**: Converts USDC to LINK using the Uniswap V3 swap router.
- **Balancer Liquidity**: Involves adding liquidity to a Balancer pool, which may be used for staking or earning fees.

This script effectively integrates Uniswap V3 and Balancer protocols to perform token swaps and manage liquidity, showcasing a complex DeFi interaction flow.


## Step-by-Step Implementation

### 1. Set Up Your Project

1. **Create a New Project Directory**
    ```bash
    mkdir defi-script
    cd defi-script
    ```

2. **Initialize a Node.js Project**
    ```bash
    npm init -y
    ```

3. **Install Required Dependencies**
    ```bash
    npm install ethers dotenv
    ```

### 2. Prepare ABI Files

Ensure that you have ABI files for the contracts you are interacting with. Place these ABI files in a directory named `abis` within your project directory:

- `factory.json`: ABI for the Uniswap V3 factory contract.
- `swaprouter.json`: ABI for the Uniswap V3 swap router contract.
- `pool.json`: ABI for the Uniswap V3 pool contract.
- `token.json`: ABI for ERC-20 tokens.
- `balancerPool.json`: ABI for the Balancer pool contract.

### 3. Create `.env` File

In the root directory of your project, create a `.env` file to store sensitive information such as your Ethereum RPC URL and private key.

**.env File Example:**
```
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key
```

Replace `YOUR_INFURA_PROJECT_ID` with your Infura project ID and `your_private_key` with your Ethereum wallet private key.

### 4. Implement the Script

Create a new file named `index.js` and paste the following code:

```javascript
import { ethers } from "ethers";
import FACTORY_ABI from "./abis/factory.json" assert { type: "json" };
import SWAP_ROUTER_ABI from "./abis/swaprouter.json" assert { type: "json" };
import POOL_ABI from "./abis/pool.json" assert { type: "json" };
import TOKEN_IN_ABI from "./abis/token.json" assert { type: "json" };
import BALANCER_POOL_ABI from "./abis/balancerPool.json" assert { type: "json" };

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
    console.log("Swap Params:", params);

    const estimatedGas = await swapRouter.estimateGas.exactInputSingle(params);
    console.log("Estimated Gas:", estimatedGas.toString());

    const tx = await swapRouter.exactInputSingle.populateTransaction(params);

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
    console.error("An error occurred:",

 error.message);
  }
}

// Enter Swap and Liquidity Amounts
main(1, 0.5);
```

### 5. Run the Script

Execute the script using Node.js:

```bash
node index.js
```

### 6. Verify Transactions

After running the script, verify the transactions on the Sepolia network using the links printed in the console logs. Check the token approval, swap, and liquidity addition transactions to ensure they were successful.

### 7. Adjust as Needed

- **Addresses and ABIs**: Ensure that the addresses and ABI files are accurate and up-to-date.
- **Amounts and Parameters**: Adjust token amounts and parameters according to your specific use case.
- **Error Handling**: Add additional error handling or logging as necessary for debugging and monitoring.

This setup should give you a fully functional script for interacting with Uniswap V3 and Balancer on the Sepolia test network.

---