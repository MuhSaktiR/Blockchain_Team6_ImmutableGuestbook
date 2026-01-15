const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");

  const Guestbook = await ethers.getContractFactory("Guestbook");

  const guestbook = await Guestbook.deploy({
    gasLimit: 3_000_000,
    gasPrice: ethers.utils.parseUnits("20", "gwei"),
  });

  console.log("📨 TX sent:", guestbook.deployTransaction.hash);
  console.log("⏳ Waiting for confirmation...");

  await guestbook.deployTransaction.wait(1);

  console.log("✅ Guestbook deployed at:", guestbook.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ DEPLOY ERROR:", error);
    process.exit(1);
  });
