const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment to Sepolia Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️  WARNING: Low balance! You may not have enough gas to deploy.");
  }

  const Guestbook = await ethers.getContractFactory("Guestbook");
  console.log("⏳ Deploying Guestbook contract...");

  const guestbook = await Guestbook.deploy();
  
  console.log("📨 TX sent:", guestbook.deployTransaction?.hash || guestbook.hash || "N/A");
  console.log("⏳ Waiting for confirmation (this may take 1-2 minutes)...");

  // Wait for deployment
  const deployTx = await guestbook.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(3); // Wait 3 confirmations
  }

  const contractAddress = await guestbook.getAddress();
  console.log("\n✅ Guestbook deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);

  // Save address to file
  const filePath = path.join(__dirname, "..", "deployed-address.txt");
  fs.writeFileSync(filePath, contractAddress, "utf8");
  console.log("💾 Address saved to deployed-address.txt");

  // Verify contract
  console.log("\n📋 Contract Details:");
  console.log("- Address:", contractAddress);
  console.log("- Network: Sepolia Testnet");
  console.log("- Chain ID: 11155111");
  
  // Check if code exists
  const provider = ethers.provider;
  const code = await provider.getCode(contractAddress);
  console.log("- Bytecode deployed:", code.length > 10 ? "✅ YES" : "❌ NO");

  console.log("\n🎉 Deployment complete!");
  console.log("Update the contractAddress in app.js with:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOY ERROR:", error.message);
    console.error("\nPossible solutions:");
    console.error("1. Check if you have enough Sepolia ETH (get from faucet)");
    console.error("2. Verify ALCHEMY_API_KEY in .env file");
    console.error("3. Verify SEPOLIA_MNEMONIC in .env file");
    console.error("4. Make sure you're connected to the internet");
    process.exit(1);
  });
