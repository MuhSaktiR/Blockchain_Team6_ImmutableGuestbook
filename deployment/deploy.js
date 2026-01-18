const hre = require("hardhat");

async function main() {
  console.log("\n==========================================");
  console.log("DEPLOYING GUESTBOOK CONTRACT");
  console.log("==========================================\n");

  // 1. Pastikan network
  console.log("Network:", hre.network.name);

  // 2. Pastikan signer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  console.log("------------------------------------------");

  // 3. Deploy dengan GAS EXPLICIT
  const Guestbook = await hre.ethers.getContractFactory("Guestbook");
  const guestbook = await Guestbook.deploy({
    gasLimit: 3_000_000,
    maxFeePerGas: hre.ethers.parseUnits("30", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei"),
  });

  console.log("📨 TX hash:", guestbook.deploymentTransaction().hash);
  console.log("⏳ Waiting for confirmation...");

  await guestbook.waitForDeployment();

  const contractAddress = await guestbook.getAddress();

  console.log("\n✅ Guestbook deployed to:", contractAddress);
  console.log("\n==========================================");
  console.log("PENTING: Update alamat contract di app.js");
  console.log("==========================================");
  console.log(`const contractAddress = "${contractAddress}";`);
  console.log("==========================================\n");

  // 4. Simpan ke file
  const fs = require("fs");
  fs.writeFileSync("deployed-address.txt", contractAddress);
  console.log("Alamat contract disimpan di: deployed-address.txt");
}

main().catch((error) => {
  console.error("DEPLOY ERROR:", error);
  process.exit(1);
});
